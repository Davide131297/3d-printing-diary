export interface Printer {
  id: string;
  name: string;
  model: string;
}

export interface Filament {
  id: string;
  name: string;
  color: string;
  manufacturer: string;
  price: number;
  weight_g: number;
  currency: string;
  material: string;
  remaining_g?: number;
}

export interface PrintFilament {
  amount_used_g: number;
  filaments: Filament;
}

export interface Print {
  id: string;
  title: string;
  model_name: string;
  makerworld_link: string;
  printer_id: string;
  print_time_minutes: number;
  created_at: string;
  printers: Printer;
  print_filaments: PrintFilament[];
}
