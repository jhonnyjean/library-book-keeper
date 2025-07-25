# Library Book Keeper System

**Created by Jhonny Jean**

A comprehensive library management system for tracking student book assignments, returns, and inventory management.

## Features

- 📚 **Book Management**: Add books manually or via barcode scanning
- 👥 **Student Management**: Individual and bulk student registration
- 📋 **Assignment Tracking**: Assign multiple books to students with due dates
- 📊 **Inventory Control**: Track book quantities, conditions, and availability
- 📱 **Barcode Scanning**: Camera-based ISBN scanning for quick book addition
- 📁 **Bulk Upload**: CSV/Excel import for student data
- 🔍 **Search & Filter**: Find students, books, and assignments quickly
- ⏰ **Overdue Tracking**: Automatic overdue book notifications

## Technologies Used

- React 18
- Tailwind CSS
- Lucide React Icons
- Papa Parse (CSV handling)
- SheetJS (Excel handling)
- Camera API for barcode scanning

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Deployment

This project is ready to be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

## Usage

1. **Students Tab**: Add students individually or upload CSV/Excel files
2. **Books Tab**: Add books manually or scan barcodes with your camera
3. **Assign Books**: Select students and books to create assignments
4. **Current Assignments**: View all checkouts and process returns

## License

MIT License - feel free to use and modify for your needs.

---

Built with ❤️ by Jhonny Jean