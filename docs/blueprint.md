# **App Name**: COCOCO Scan

## Core Features:

- Login Page: Implement a login page with a basic (non-strict) validation. Provides a faux authentication.
- Sidebar and Header: Design a responsive sidebar that can be collapsed. User profile information is shown on the header with a dropdown for settings/options.
- Category Management: Create a 'Categories' screen that shows existing categories in a table. Columns include Name, AI Model, Date Created, Description, and actions (Edit, Delete).
- Add Category: Build an 'Add Category' screen (or modal) with fields for Name, AI Model Selection, Prompt, Instructions, and a drag-and-drop file upload for TXT, PDF, images.
- Analyze Catalog Input: Implement an 'Analyze Catalog' section to select a category, enter a catalog name, and upload a file (drag and drop).
- Scanned Results: Display results of previously scanned files, sorted by category, date, catalog name.
- File Analysis Tool: Use the LLM as a tool to find relevant information within the files that the user uploads.

## Style Guidelines:

- Primary color: Deep sky blue (#ff1493) for a clean, tech-focused feel.
- Background color: Off-white (#f2f4f5) to provide a neutral, uncluttered backdrop.
- Accent color: Electric lime (#6bff00) to draw the eye to interactive elements.
- Body font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look; suitable for body text.
- Headline font: 'Space Grotesk', a proportional sans-serif with a computerized, techy, scientific feel; good for headlines.
- Use clean, vector-based icons to represent categories, actions, and file types. Ensure the style remains consistent and readable at various sizes.
- Employ a modular layout with clear sections for navigation, content, and user information. Use whitespace effectively to avoid clutter and maintain readability. Ensure responsiveness across different screen sizes.
- Apply smooth and clean animations on user interactions like the input focus. When interacting with any element in the UI it has to be accompanied by a transition on the pink-blue-green pallete