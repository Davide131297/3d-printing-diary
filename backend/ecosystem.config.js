module.exports = {
  apps: [
    {
      name: "3d-printing-backend",
      script: "./index.js", // Oder deine Entry-Datei (z.B. index.js, app.js)
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "/home/pi/logs/3d-printing-backend-error.log",
      out_file: "/home/pi/logs/3d-printing-backend-out.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
