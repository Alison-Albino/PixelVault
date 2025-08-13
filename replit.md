# Overview

PixelVault is a client-side encrypted password, note, and file manager built with a retro pixel art aesthetic. The application functions as a secure digital vault that stores passwords, notes, and files locally in the browser using client-side encryption. It features a master password system for authentication and uses a retro 8-bit gaming visual style with pixel art elements, reminiscent of classic arcade games.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Pure Web Technologies**: Built entirely with vanilla HTML, CSS, and JavaScript without any frameworks or libraries
- **Single Page Application (SPA)**: Uses screen-based navigation with JavaScript to show/hide different sections
- **Component-Based Structure**: Organized around distinct functional areas (login, main dashboard, entry management)
- **Event-Driven Architecture**: Relies on DOM event listeners to handle user interactions and form submissions

## Data Management
- **Client-Side Storage**: Uses localStorage for persistent data storage in the browser
- **Encryption Strategy**: Implements client-side encryption/decryption of all sensitive data using the master password
- **No Backend Dependencies**: Completely self-contained application that runs entirely in the browser
- **Entry Types Support**: Designed to handle three distinct data types: passwords, notes, and files

## Security Model
- **Master Password Authentication**: Single password protects access to the entire vault
- **Client-Side Encryption**: All data is encrypted before storage and decrypted only when needed
- **First-Time Setup**: Includes setup flow for new users to create their master password
- **Local-Only Storage**: No data transmission to external servers, maintaining complete privacy

## User Interface Design
- **Pixel Art Aesthetic**: Implements retro 8-bit gaming visual style throughout the application
- **Custom CSS Framework**: Hand-crafted pixel art styling with custom color palette and fonts
- **Press Start 2P Font**: Uses Google Fonts integration for authentic retro typography
- **Responsive Pixel Design**: Maintains pixel art styling across different screen sizes
- **Modal-Based Interactions**: Uses overlay screens for detailed views and editing

## File Management
- **Base64 Encoding**: Converts uploaded files to Base64 format for local storage
- **Media Viewer**: Built-in viewer for images and videos with pixel art styling
- **File Type Support**: Handles multiple file formats including JPG, PNG, and MP4
- **Secure File Storage**: Files are encrypted along with other vault data

# External Dependencies

## Third-Party Services
- **Google Fonts**: Integrates Press Start 2P font for authentic retro typography
- **No Other External APIs**: Application is designed to work completely offline

## Browser APIs
- **localStorage**: For persistent data storage in the browser
- **File API**: For handling file uploads and reading file contents
- **Crypto API**: For client-side encryption and decryption operations
- **DOM API**: For dynamic content manipulation and event handling

## Development Dependencies
- **None**: Pure vanilla web technologies with no build process or package managers required
- **Browser Compatibility**: Designed to work with modern web browsers that support ES6+ features