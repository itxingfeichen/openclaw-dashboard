# Contributing to OpenClaw Dashboard

Thank you for your interest in contributing to OpenClaw Dashboard! This document provides guidelines and instructions for contributing.

## 🎯 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Collaborate openly

## 📋 How to Contribute

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/openclaw-dashboard.git
cd openclaw-dashboard
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Make Changes

Follow the coding standards:

#### Frontend
- Use TypeScript for all new code
- Follow ESLint rules
- Format code with Prettier before committing
- Write meaningful commit messages

#### Backend
- Use TypeScript/JavaScript (ES Modules)
- Follow existing code structure
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

#### Frontend
```bash
cd frontend
npm run lint
npm run format:check
npm run build
```

#### Backend
```bash
cd backend
npm run lint
npm run test
npm run build
```

### 5. Commit Changes

Use conventional commit messages:

```
feat: add user management dashboard
fix: resolve authentication token expiry issue
docs: update API documentation
style: format code according to Prettier
refactor: improve database connection handling
test: add unit tests for user service
```

### 6. Submit a Pull Request

1. Push your branch to GitHub
2. Open a Pull Request
3. Describe your changes
4. Link any related issues
5. Wait for review

## 📐 Coding Standards

### TypeScript

- Use strict mode
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Export types from dedicated files

### React

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript props interfaces
- Follow React best practices

### API Design

- Use RESTful conventions
- Version APIs (e.g., `/api/v1/...`)
- Return consistent error formats
- Document all endpoints

## 🧪 Testing

### Frontend
- Write unit tests for utility functions
- Test components with React Testing Library
- Ensure 80%+ code coverage for new features

### Backend
- Write unit tests for services
- Test API endpoints
- Include integration tests for database operations

## 📖 Documentation

- Update README.md for significant changes
- Add JSDoc comments for public APIs
- Update API documentation for endpoint changes
- Include usage examples

## 🔍 Code Review

All submissions require review. Reviewers will check:

- Code quality and style
- Test coverage
- Documentation completeness
- Security considerations
- Performance implications

## 🐛 Reporting Issues

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed reproduction steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Node.js version, OS, browser (if applicable)
6. **Screenshots**: If applicable

## 💡 Feature Requests

For feature requests, provide:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Use Cases**: Example scenarios
4. **Alternatives Considered**: Other approaches

## 🚀 Release Process

1. All tests must pass
2. Code review approved
3. Documentation updated
4. Version bump following semver
5. Changelog updated

## 📞 Questions?

Feel free to open an issue for any questions or discussions.

---

Thank you for contributing to OpenClaw Dashboard! 🎉
