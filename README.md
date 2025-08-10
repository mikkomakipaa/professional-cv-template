# Professional CV Website Template

A modern, responsive professional CV website built with React, Vite, and Tailwind CSS, featuring an AI-powered chatbot for interactive candidate engagement.

![Professional CV Website](https://img.shields.io/badge/React-18.2.0-blue) ![Vite](https://img.shields.io/badge/Vite-4.5.5-green) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4.17-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

- **Modern Responsive Design** - Optimized for desktop, tablet, and mobile viewing
- **AI-Powered Chatbot** - Interactive OpenAI Assistant integration for candidate Q&A
- **Professional Timeline** - Visual career progression with company-specific styling
- **Dark/Light Mode Support** - Automatic theme detection and manual toggle
- **SEO Optimized** - Structured data markup and meta tags for search engines
- **Fast Performance** - Built with Vite for optimal loading speeds
- **Professional Presentation** - Recruiter-focused layout and information hierarchy

## 🚀 Live Demo

Visit the live site: [https://mikko-makipaa-cv.vercel.app](https://mikko-makipaa-cv.vercel.app)

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.2.0
- **Build Tool**: Vite 4.5.5
- **Styling**: Tailwind CSS 3.4.17
- **AI Integration**: OpenAI Assistant API
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16.0.0 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mikkomakipaa/professional-cv-website.git
cd professional-cv-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your OpenAI API key to the `.env` file:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The chatbot will display a configuration message if the API key is not provided.

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎨 Customization

### Personal Information
Edit the following in `src/App.jsx`:

1. **Profile Photo**: Replace `src/assets/mikkomakipaa.jpg` with your photo
2. **Personal Details**: Update name, title, and contact information
3. **Career Timeline**: Modify the work experience data
4. **Professional Overview**: Update the description and achievements
5. **Quick Facts**: Customize the header information

### OpenAI Assistant Configuration
Update the assistant ID in `src/App.jsx`:

```javascript
// Line 70
assistant_id: 'your_assistant_id_here'
```

### Styling
- **Colors**: Modify Tailwind classes throughout components
- **Layout**: Adjust spacing, typography, and responsive breakpoints
- **Dark Mode**: Customize dark theme colors using Tailwind's dark: prefix

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Environment Variables**: Add your `VITE_OPENAI_API_KEY` in Vercel dashboard

3. **Custom Domain**: Configure your domain in Vercel settings

### Deploy to Other Platforms

#### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

#### GitHub Pages
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

## 📁 Project Structure

```
professional-cv-website/
├── src/
│   ├── assets/          # Images and static files
│   ├── App.jsx          # Main application component
│   ├── App.css          # Custom styles
│   └── main.jsx         # Application entry point
├── public/              # Public assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤖 AI Assistant Setup

### Creating an OpenAI Assistant

1. **Visit OpenAI Platform**: Go to [platform.openai.com](https://platform.openai.com)
2. **Create Assistant**: Navigate to Assistants section
3. **Configure Instructions**: Set up your professional knowledge base
4. **Get Assistant ID**: Copy the assistant ID for your `.env` file
5. **API Key**: Generate an API key with Assistant permissions

### Assistant Configuration Example

```
You are a professional career assistant for [Your Name]. You have comprehensive knowledge of their work history, skills, and achievements. Answer recruiter and employer questions with specific, factual information about their career progression, technical expertise, and professional accomplishments.
```

## 🎯 SEO Configuration

The template includes comprehensive SEO setup:

- **Meta Tags**: Title, description, keywords
- **Open Graph**: Social media sharing optimization
- **Structured Data**: JSON-LD schema for search engines
- **Sitemap**: Automatic generation for search indexing

## 📱 Responsive Design

The website is fully responsive with breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔒 Privacy & Security

- **API Key Protection**: Environment variables prevent exposure
- **Email Privacy**: Uses alias email addresses
- **No Sensitive Data**: Only public professional information
- **HTTPS**: Secure connection in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Vite](https://vitejs.dev/)
- AI integration with [OpenAI](https://openai.com/)
- Deployed on [Vercel](https://vercel.com/)
- Created with assistance from [Claude Code](https://claude.ai/code)

## 📞 Support

If you have questions about using this template:

1. Check the [Issues](https://github.com/mikkomakipaa/professional-cv-website/issues) page
2. Create a new issue with detailed description
3. Provide error messages and browser information

---

**Made with ❤️ using React, Tailwind CSS, and OpenAI**