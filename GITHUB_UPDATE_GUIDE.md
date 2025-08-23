# STRES Extension - GitHub Update Guide

This guide explains how to update your STRES SillyTavern extension repository on GitHub with the enhanced v2.0 features.

## 📋 Prerequisites

1. **Git installed** on your system
2. **GitHub account** and repository access
3. **Local copy** of the STRES extension files
4. **SSH key or GitHub token** configured for authentication

## 🚀 Method 1: Update Existing Repository

### Step 1: Prepare Your Local Repository

```bash
# Navigate to your extension directory
cd /path/to/stres-sillytavern-extension

# Initialize git if not already done
git init

# Add GitHub remote (replace with your actual repository URL)
git remote add origin https://github.com/arw052/stres-sillytavern-extension.git

# Or if using SSH:
git remote add origin git@github.com:arw052/stres-sillytavern-extension.git

# Check current status
git status
```

### Step 2: Prepare Files for Commit

```bash
# Add all the enhanced files
git add .

# Or add specific files/directories:
git add index.js
git add components/
git add themes/
git add README.md
git add manifest.json

# Check what will be committed
git status
```

### Step 3: Create Commit with Enhanced Features

```bash
# Commit with descriptive message
git commit -m "feat: STRES v2.0 Enhanced Edition - Complete RPG Automation Platform

- Add 20+ enhanced RPG tools with LLM integration
- Implement character card import/export (v2, SillyTavern, STRES, JSON)
- Add advanced character panel with multi-tab interface
- Integrate lorebook system with context-aware activation
- Support 7-stat system including Luck (LCK) for otherworlders
- Add skill progression with 7-tier ranking system
- Implement magic schools with 12 elemental affinities
- Add comprehensive settings panel with all enhanced features
- Support multiple rulesets (Isekai, D&D 5e, Generic, Custom)
- Enhanced visual themes with advanced RPG data styling
- Add automatic state tracking from narrative text
- Implement world building with factions, locations, demographics
- Add unique skill system for otherworlder characters
- Support pattern recognition for all LLM models
- Add enhanced notifications and toast system
- Implement responsive design for mobile compatibility
- Add troubleshooting guide and comprehensive documentation

🎮 Generated with STRES v2.0 Enhanced Edition

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 4: Push to GitHub

```bash
# Push to main branch
git push -u origin main

# Or if your default branch is master:
git push -u origin master
```

## 🔄 Method 2: Create New Repository

### Step 1: Create Repository on GitHub

1. Go to [GitHub.com](https://github.com)
2. Click "New repository" or "+"
3. Repository name: `stres-sillytavern-extension`
4. Description: `STRES v2.0 Enhanced - Advanced RPG automation extension for SillyTavern with character cards, lorebooks, and LLM tool integration`
5. Set to **Public** (recommended for SillyTavern extensions)
6. **Don't** initialize with README (we have our own)
7. Click "Create repository"

### Step 2: Connect Local Files

```bash
# Navigate to your extension directory
cd /home/imbe/SillyTavernProject/stres-project/extension/

# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "feat: Initial STRES v2.0 Enhanced Edition release

Complete RPG automation platform for SillyTavern with:
- 20+ advanced RPG tools
- Character card import/export
- Advanced character progression
- Lorebook integration
- Multi-tab character panel
- Otherworlder unique skills
- Comprehensive world building
- LLM tool integration

🎮 Generated with STRES v2.0 Enhanced Edition"

# Add remote origin (replace with your GitHub username)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stres-sillytavern-extension.git

# Push to GitHub
git push -u origin main
```

## 📦 Method 3: Using GitHub Desktop (GUI Option)

### Step 1: Install GitHub Desktop
- Download from [desktop.github.com](https://desktop.github.com)
- Sign in with your GitHub account

### Step 2: Create Repository
1. Click "Create a New Repository on your hard drive"
2. Name: `stres-sillytavern-extension`
3. Local path: Choose where to create it
4. Click "Create repository"

### Step 3: Copy Files
- Copy all your STRES extension files into the created repository folder
- GitHub Desktop will automatically detect the changes

### Step 4: Commit and Publish
1. Write commit summary: "STRES v2.0 Enhanced Edition - Complete RPG Platform"
2. Add detailed description of changes
3. Click "Commit to main"
4. Click "Publish repository"
5. Make it public
6. Click "Publish repository"

## 🏷️ Method 4: Create Release with Version Tags

After pushing your code, create a proper release:

```bash
# Create version tag
git tag -a v2.0.0 -m "STRES v2.0 Enhanced Edition

Major release featuring:
- Enhanced character system with 7 stats including LCK
- Character card import/export compatibility
- Advanced lorebook integration
- 20+ RPG tools with LLM integration
- Multi-tab character interface
- Otherworlder unique skills system
- Comprehensive world building
- Multiple RPG ruleset support"

# Push tags
git push origin --tags
```

Then on GitHub:
1. Go to your repository
2. Click "Releases" → "Create a new release"
3. Choose tag: v2.0.0
4. Release title: "STRES v2.0 Enhanced Edition"
5. Add release notes (copy from tag message)
6. Click "Publish release"

## 📋 Essential Files to Include

Make sure your repository contains:

```
stres-sillytavern-extension/
├── index.js                    # Main extension file
├── manifest.json              # SillyTavern extension manifest
├── README.md                  # Complete documentation
├── components/
│   ├── tool-integration.js    # LLM tool integration
│   ├── enhanced-character-panel.js  # Advanced character UI
│   ├── auto-injector.js       # Context injection
│   ├── character-panel.js     # Basic character display
│   └── command-processor.js   # Slash command handling
├── themes/
│   ├── enhanced-v2.css        # Enhanced styling
│   ├── enhanced-fantasy.css   # Fantasy theme
│   └── minimal.css            # Minimal theme
├── LICENSE                    # MIT License
├── CHANGELOG.md              # Version history
└── docs/                     # Additional documentation
    ├── INSTALLATION.md       # Installation guide
    ├── COMMANDS.md          # Command reference
    └── TROUBLESHOOTING.md   # Common issues
```

## 🔗 Update SillyTavern Extension URL

For users to install via SillyTavern Extensions panel, they need:

```
https://github.com/YOUR_USERNAME/stres-sillytavern-extension
```

Update this URL in:
1. Your README.md installation instructions
2. Any documentation that references the repository
3. The main STRES project documentation

## ✅ Verification Steps

After updating GitHub:

1. **Test Installation**: Try installing the extension via SillyTavern's extension panel using your GitHub URL
2. **Check Files**: Verify all necessary files are present and accessible
3. **Test Functionality**: Confirm all enhanced features work correctly
4. **Documentation**: Ensure README displays properly on GitHub
5. **Releases**: Create tagged releases for version management

## 🐛 Common Issues

### Push Rejected
```bash
# If you get "non-fast-forward" error:
git pull origin main --rebase
git push origin main
```

### Large Files
```bash
# If you have large files (>100MB):
git lfs track "*.large"
git add .gitattributes
```

### Authentication Issues
```bash
# Use personal access token for HTTPS:
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/stres-sillytavern-extension.git
```

## 📈 Best Practices

1. **Semantic Versioning**: Use version tags like v2.0.0, v2.1.0, etc.
2. **Clear Commits**: Write descriptive commit messages
3. **Documentation**: Keep README.md updated with all features
4. **Releases**: Create GitHub releases for major versions
5. **Issues**: Enable GitHub Issues for user feedback
6. **Branches**: Use feature branches for development
7. **Testing**: Test installation process regularly

## 🎯 Next Steps

After successfully updating to GitHub:

1. **Update Main Project**: Update references in the main STRES repository
2. **Community Sharing**: Share the repository in SillyTavern community
3. **Documentation**: Create wiki pages for advanced usage
4. **Feedback**: Monitor issues and user feedback
5. **Continuous Updates**: Plan regular updates and maintenance

Your STRES v2.0 Enhanced Edition extension is now ready for the world! 🚀