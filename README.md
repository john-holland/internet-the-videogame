# Internet the Video Game

A multiplayer game where players compete against the internet by identifying real comments among manipulated content. Players take turns being "The One" who creates fake content, while the audience tries to spot the real content.

## Features

- Real-time multiplayer gameplay
- Integration with Internet Archive's Wayback Machine
- Dynamic audience visualization
- Cohort-based scoring system
- Real-time game state management
- Beautiful and modern UI

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- OpenShift cluster (for production deployment)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/internet-the-videogame.git
cd internet-the-videogame
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=internet_game
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Wayback Machine API
WAYBACK_API_KEY=your_api_key
```

4. Set up the database:
```bash
npm run db:setup
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing

Run the test suite:
```bash
npm test
```

## Production Deployment

For production deployment, follow the instructions in `docs/OPENSHIFT_SETUP.md`.

## Game Rules

1. Each round, one player becomes "The One" who creates fake content
2. The One submits up to 3 fake answers
3. The audience and other players try to identify the real content
4. Points are awarded based on correct identifications
5. Audience members are organized into cohorts that compete against each other
6. The game continues for a predetermined number of rounds
7. The player with the highest score at the end wins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Internet Archive's Wayback Machine for providing historical web content
- Next.js team for the amazing framework
- OpenShift team for the container platform

**Credits:**
This project benefited from AI code assistance by [Cursor](https://www.cursor.com/).
