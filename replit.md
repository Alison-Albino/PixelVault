# Overview

PixelVault is a secure password, note, and file manager with retro pixel art aesthetic. The application has been upgraded to a full-stack web application with user authentication, PostgreSQL database storage, and client-side encryption. Users can create accounts, log in, and access their encrypted vault using a master password. All sensitive data is encrypted client-side before being stored in the database, ensuring maximum security.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Full-Stack Architecture
- **Backend**: Node.js with Express.js framework serving RESTful API endpoints
- **Database**: PostgreSQL with encrypted data storage and user management
- **Frontend**: Vanilla HTML, CSS, and JavaScript with API client for backend communication
- **Authentication**: Multi-layer security with user accounts and master password verification
- **Session Management**: Express sessions with PostgreSQL store for persistent login state

## Backend Architecture
- **Express.js Server**: RESTful API with routes for authentication, user management, and vault entries
- **Database Schema**: Users table for accounts, vault_entries for encrypted data, session table for authentication
- **Security Middleware**: Helmet for security headers, CORS for cross-origin requests, rate limiting for API protection
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes and user-friendly messages

## Data Management
- **PostgreSQL Database**: Persistent storage with proper table relationships and constraints
- **Client-Side Encryption**: All sensitive vault data encrypted with master password before database storage
- **Session Storage**: User authentication state maintained in secure PostgreSQL session store
- **API Layer**: RESTful endpoints for all CRUD operations with proper authentication middleware

## Security Model
- **Dual Authentication**: User account login plus master password verification for vault access
- **Encrypted Storage**: All vault data encrypted client-side using CryptoJS AES encryption
- **Session Security**: HTTP-only cookies with configurable timeouts and secure flags
- **Rate Limiting**: API protection against brute force attacks and abuse
- **Input Validation**: Server-side validation for all user inputs and file uploads

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

## Backend Dependencies
- **express@4.18.2**: Web framework for Node.js with RESTful API routing
- **express-session@1.17.3**: Session middleware for user authentication state
- **express-rate-limit@6.10.0**: Rate limiting middleware for API protection
- **pg**: PostgreSQL client for database operations
- **bcryptjs**: Password hashing library for secure user authentication
- **helmet**: Security middleware for HTTP headers
- **cors**: Cross-Origin Resource Sharing middleware
- **dotenv**: Environment variable configuration
- **uuid**: UUID generation for unique identifiers
- **crypto-js**: Client-side encryption library (also used on frontend)

## Frontend Dependencies
- **CryptoJS**: Client-side encryption/decryption of vault data
- **Google Fonts**: Press Start 2P font for retro aesthetic
- **Vanilla JavaScript**: ES6+ features for modern browser compatibility

## Database Requirements
- **PostgreSQL**: Primary database for user accounts and encrypted vault entries
- **Session Store**: PostgreSQL-based session storage for authentication persistence

## Deployment Compatibility
- **VPS Ready**: Designed for deployment on any VPS with Node.js and PostgreSQL support
- **Environment Variables**: Configurable database connection and security settings
- **Production Security**: HTTPS support, secure cookies, and environment-specific configurations