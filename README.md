# Davie Jones Shipping Quote Tool

This is a single-page application that allows users to request shipping quotes based on port combinations, container types, and any special requirements. It uses JSON data hosted locally through `json-server`.

## Features

- Dynamically filters and displays quotes from JSON data
- Input validation for required selections
- Responsive layout for desktop and mobile
- Custom hover effects
- Ability to enter special instructions
- Accessible UX with visual feedback

## Technologies

- HTML5
- CSS
- JavaScript
- JSON Server

## Installation

1. Clone this repository:

   git clone https://github.com/yourusername/shipping-quotes-app.git

2. Navigate to the project folder:
```bash 
cd shipping-quotes-app
```

3. Install and run json-server:
```bash 
npm install -g json-server
json-server --watch db.json
```

4. Open index.html in your browser to use the app.

## Usage
- Enter your company name

- Select at least one load port, destination, and container type

- Toggle and fill special requirements (optional)

- Submit to view quotes

