# WispaChat

WispaChat is a modern, feature-rich chat application that enables seamless communication through text, voice, and video calls. With a focus on user experience and performance, WispaChat provides a robust platform for both personal and professional communication.

## Features

- 💬 Real-time text messaging
- 📞 Voice and video calls
- 📱 Responsive design for mobile and desktop
- 🎨 Modern UI with shadcn-ui components
- 📁 File sharing and media preview
- 👥 Group chat support
- 🔔 Push notifications
- 📊 Message status tracking
- 🔒 Secure authentication
- ⚡ Built with performance in mind

## Getting Started

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Tech Stack

WispaChat is built with modern technologies for optimal performance and developer experience:

- ⚡ **Vite** - Next Generation Frontend Tooling
- 🔷 **TypeScript** - For type-safe code
- ⚛️ **React** - UI Framework
- 🎨 **shadcn/ui** - High-quality UI components
- 🌈 **Tailwind CSS** - Utility-first CSS framework
- 🔌 **Supabase** - Backend and real-time features
- 🚀 **WebRTC** - For voice and video calls
- 📦 **Bun** - Fast package manager and runtime

## Environment Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

- `/src` - Application source code
  - `/components` - Reusable UI components
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/pages` - Application pages/routes
  - `/services` - API and service integrations
  - `/types` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
