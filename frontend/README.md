# 3D Printing Diary

A comprehensive application to track your 3D printing projects, manage filament inventory, and organize your printing workflow.

## Features

- **Print Project Management**: Easily log your 3D prints with detailed tracking.
- **Automated Metadata**: Paste a MakerWorld URL to automatically fetch model details, images, and print times using a built-in crawler.
- **Inventory System**:
  - Track filament usage and remaining stock.
  - Manage printers with custom images.
  - Organization by manufacturer and colors.
- **Modern Interface**: A responsive and beautiful UI built with modern web technologies.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Forms**: React Hook Form & Zod
- **Automation**: Puppeteer (for scraping model data)

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd 3d-druck-tagebuch
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Set up Environment Variables:**

   Create a `.env` file and configure your `MONGODB_URI_STRING` and other necessary secrets.

4. **Run the development server:**

   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
