# Contributing to Bash Parser

Thank you for considering contributing to this project! Your help is greatly appreciated. Below are some guidelines to help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Style Guide](#style-guide)
- [Testing](#testing)
- [License](#license)

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to understand the expectations for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on the [GitHub repository](https://github.com/einhq/bash-parser/issues) and include:

- A clear and descriptive title.
- A detailed description of the problem.
- Steps to reproduce the issue.
- Any relevant logs or screenshots.

### Suggesting Enhancements

If you have an idea for an enhancement, please open an issue on the [GitHub repository](https://github.com/einhq/bash-parser/issues) and include:

- A clear and descriptive title.
- A detailed description of the enhancement.
- Any relevant examples or use cases.

### Submitting Pull Requests

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a pull request on the [GitHub repository](https://github.com/einhq/bash-parser/pulls).

Please ensure your pull request adheres to the following guidelines:

- Follow the [Style Guide](#style-guide).
- Include tests for any new functionality.
- Ensure all tests pass before submitting.

## Development Setup

To set up your development environment, follow these steps:

1. Clone the repository:

```sh
git clone https://github.com/einhq/bash-parser.git
cd bash-parser
```

2. Run the tests to ensure everything is working:

```sh
deno task test
```

## Style Guide

Please follow the existing code style and conventions. We use Deno's standard style guide for this project.

## Testing

Ensure that your changes do not break existing tests and add new tests for any new functionality. To run the tests, use:

```sh
deno task test
```

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

Thank you for your contributions!
