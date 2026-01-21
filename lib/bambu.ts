import mqtt from "mqtt";
import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.NEXTAUTH_SECRET ||
  "default-secret-key-min-32-chars-please-change-me";
const IV_LENGTH = 16;
// Ensure key is 32 bytes for AES-256-CBC
const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);

export interface PrinterConfig {
  ip: string;
  accessCode: string;
  serial: string;
}

export interface BambuStatus {
  printStatus: "PRINTING" | "IDLE" | "PAUSE" | "FINISH" | "OFFLINE" | "UNKNOWN";
  modelName: string;
  progress: number;
  remainingTimeMinutes: number;
  filaments: {
    slot: number;
    type: string;
    color: string;
    remaining_g?: number; // Estimated from AMS usage if available
  }[];
  ams: {
    slot: number;
    filamentId?: string;
  }[];
}

export class BambuClient {
  private client: mqtt.MqttClient | null = null;
  private config: PrinterConfig;

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  // Encryption helper
  static encryptCode(code: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(code);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  // Decryption helper
  static decryptCode(encryptedText: string): string {
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedTextBuffer = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedTextBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `mqtts://${this.config.ip}:8883`;
      const options: mqtt.IClientOptions = {
        username: "bblp",
        password: this.config.accessCode,
        rejectUnauthorized: false, // Bambu printers use self-signed certs
        connectTimeout: 5000,
        reconnectPeriod: 0, // IMPORTANT: Disable auto-reconnect to prevent background retry loops
      };

      this.client = mqtt.connect(url, options);

      this.client.on("connect", () => {
        console.log("Connected to Bambu Printer via MQTT");
        resolve();
      });

      this.client.on("error", (err) => {
        console.error("MQTT Connection Error:", err);
        reject(err);
      });
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  async getPrintStatus(): Promise<BambuStatus> {
    if (!this.client || !this.client.connected) {
      throw new Error("Printer not connected");
    }

    return new Promise((resolve, reject) => {
      // Subscribe to report topic
      const reportTopic = `device/${this.config.serial}/report`;
      this.client?.subscribe(reportTopic, (err) => {
        if (err) return reject(err);
      });

      // Request a push implementation
      const requestPayload = JSON.stringify({
        pushing: {
          sequence_id: "0",
          command: "pushall",
        },
        user_id: "1234567890", // Dummy user ID often works
      });

      this.client?.publish(
        `device/${this.config.serial}/request`,
        requestPayload,
      );

      // Listen for message
      const messageHandler = (topic: string, message: Buffer) => {
        if (topic === reportTopic) {
          try {
            const data = JSON.parse(message.toString());
            const printData = data.print;

            if (!printData) return; // Might be a subset message

            // Parse status
            let status: BambuStatus["printStatus"] = "UNKNOWN";
            if (printData.gcode_state === "RUNNING") status = "PRINTING";
            else if (printData.gcode_state === "IDLE") status = "IDLE";
            else if (printData.gcode_state === "PAUSE") status = "PAUSE";
            else if (printData.gcode_state === "FINISH") status = "FINISH";

            // Parse AMS / Filaments
            // Note: Bambu AMS data structure is complex, this is a simplified extraction
            const filaments = [];
            const ams = printData.ams?.ams?.[0]?.tray || []; // Assuming single AMS for now

            for (let i = 0; i < ams.length; i++) {
              const tray = ams[i];
              filaments.push({
                slot: i,
                type: tray.tray_type || "Unknown",
                color: tray.tray_color || "#000000",
                remaining_g: tray.remain || 0, // Sometimes explicitly sent, often calculated
              });
            }

            let modelName =
              printData.subtask_name || printData.gcode_file || "";

            // Clean up model name if it ends with .gcode.3m or similar
            modelName = modelName.replace(/\.gcode(\.3m)?$/i, "");

            const result: BambuStatus = {
              printStatus: status,
              modelName: modelName,
              progress: printData.mc_percent || 0,
              remainingTimeMinutes: printData.mc_remaining_time || 0,
              filaments,
              ams: [],
            };

            this.client?.removeListener("message", messageHandler);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        }
      };

      this.client?.on("message", messageHandler);

      // Timeout if no response
      setTimeout(() => {
        this.client?.removeListener("message", messageHandler);
        reject(new Error("Timeout waiting for printer status"));
      }, 10000);
    });
  }
}
