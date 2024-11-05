# EasyScraper

## Intial Outline
- [x] User can signup for a new account
* User can login to account
* User can create Scraping Projects
* User can define Page Templates
    - Page Template
        - Output Type (Page Generator / Leaf)
        - Name (e.g. Category Page)
        - Output  (if Type=Page Generator, select which page template it returns)
        - Page Template Examples (url + list(if page generator) or dict(if leaf page)
* User can define Seed Pages
    - Seed Page
        - Url
        - Page Type
* Saving Page Templates auto builds the scraper
* User can trigger scraping for the project (each scrape run generate an output)
    - Output
        - XLSX file containing leaf rows (each sheet = one leaf type)
        - Multiple JSONL files (one per leaf type)
        - Multiple CSV files (one per leaf type)
* Scrape Runs can be resumed if they are interrupted by failures
* User can set scrape settings
    - Sleep time between page scrapes


# Product Requirements Document (PRD)

## EasyScraper Tool

### Overview
The EasyScraper Tool is designed to enable users to efficiently create, manage, and execute web scraping projects. This document outlines the key features, functionality, and requirements for the development of this software.

### Purpose
The purpose of this tool is to simplify the process of web scraping for users, providing a user-friendly interface to create scraping projects, define pages, and collect data with minimal technical knowledge. 

### Target Audience
- Data analysts
- Researchers
- Market analysts
- Developers seeking to gather data from websites

### Features

#### 1. User Account Management
- **Signup for a New Account**
  - Users can register for a new account by providing necessary details (e.g., email, password).
  
- **Login to Account**
  - Existing users can log in using their registered credentials.

#### 2. Project Management
- **Create Scraping Projects**
  - Users can initiate a new scraping project which can be named and configured according to their requirements.

#### 3. Page Definition
- **Define Pages**
  - Users can define the structure of pages within a scraping project, including:
    - **Page Type**: Options include Page Generator (for generating additional pages based on a primary page) and Leaf (for final pages with data).
    - **Name**: User-defined name for easy identification (e.g., Category Page).
    - **Returns**: If `Type=Page Generator`, users can select which page name it will return.
    - **Examples**: Users can provide example URLs and data structure:
      - List (if page generator)
      - Dict (if leaf page)

#### 4. Starting Page Targets
- **Define Starting Page Targets**
  - Users can specify the initial targets for scraping, including:
    - **Page Target**
      - **Url**: The URL to scrape.
      - **Page Type**: Type of page target (Page Generator or Leaf).

#### 5. Scraper Building
- **Saving Pages Auto Builds the Scraper**
  - Automatically generates the scraping logic and schema based on user-defined pages and targets.

#### 6. Triggering Scrapes
- **User Can Trigger Scraping for the Project**
  - Users can initiate a scraping session which generates output files:
    - **Output Formats**:
      - **XLSX file** containing leaf rows (with separate sheets for each leaf type).
      - **Multiple JSONL files** (one per leaf type).
      - **Multiple CSV files** (one per leaf type).

#### 7. Scraping Resilience
- **Resume Interrupted Scrape Runs**
  - Users can pause and resume scraping sessions, ensuring that incomplete scrapes due to failures can be continued without starting over.

#### 8. Scrape Settings Configuration
- **User Can Set Scrape Settings**
  - Users can configure settings such as sleep time (delay between page scrapes), giving control over scraping speed and reducing risk of IP bans.

### User Stories
1. **As a new user**, I want to create an account so that I can access the web scraping tool.
2. **As a logged-in user**, I want to create a new scraping project to manage my web scraping tasks.
3. **As a user**, I want to define the pages that I want to scrape so that I can specify where to extract data from.
4. **As a user**, I want to define page targets so that I can start the scraping process from those specific URLs.
5. **As a user**, I want to save my page definitions and targets to automatically build the scraper, saving me time and effort.
6. **As a user**, I want to trigger scrapes and receive my extracted data in various output formats for further analysis.
7. **As a user**, I want the ability to resume scraping after an interruption so that I do not lose my progress.
8. **As a user**, I want the ability to configure sleep time between page scrapes to prevent overwhelming the target servers.

### Acceptance Criteria
- All user account functionalities (signup/login) must be fully operational and secure.
- Users should be able to create and manage scraping projects effortlessly.
- The page and target definitions must be saved correctly and should auto-generate working scrapers.
- The tool must successfully trigger scrapes and output data in the specified formats.
- The ability to resume interrupted scrapes must work without data loss.
- Scrape settings must allow users to set a sleep time that affects subsequent requests.

### Technical Requirements
- The application should be built with a responsive design to support various devices.
- A robust backend to handle user management, project storage, and scraping task execution.
- Use of a database to store user accounts, project data, and scrape outputs.
- Implement error handling and logging for tracking scraping processes.

### Conclusion
This PRD serves as a foundational document for the development of the Web Scraping Tool, detailing features, user stories, and requirements tailored to provide a seamless experience for users. The aim is to provide a comprehensive and intuitive application that empowers users to extract data efficiently and effectively.


# Tech Stack
- UI
  - Vite + React + Chakra UI
- API
  - UV + FastAPI
- DB
  - SQLlite
- TaskExecutor
  - Celery
