import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
});

async function setupDatabase() {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY,
        status VARCHAR(20) NOT NULL,
        round INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        name VARCHAR(100) NOT NULL,
        score INTEGER DEFAULT 0,
        is_host BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audience_members (
        id UUID PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        cohort_id VARCHAR(50) NOT NULL,
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rounds (
        id UUID PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        content_id VARCHAR(255) NOT NULL,
        content_type VARCHAR(20) NOT NULL,
        content_url VARCHAR(255) NOT NULL,
        correct_answer_id VARCHAR(255) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fake_answers (
        id UUID PRIMARY KEY,
        round_id UUID REFERENCES rounds(id),
        player_id UUID REFERENCES players(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS selections (
        id UUID PRIMARY KEY,
        round_id UUID REFERENCES rounds(id),
        player_id UUID REFERENCES players(id),
        audience_member_id UUID REFERENCES audience_members(id),
        selected_answer_id VARCHAR(255) NOT NULL,
        is_correct BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cohorts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
      CREATE INDEX IF NOT EXISTS idx_audience_members_game_id ON audience_members(game_id);
      CREATE INDEX IF NOT EXISTS idx_rounds_game_id ON rounds(game_id);
      CREATE INDEX IF NOT EXISTS idx_fake_answers_round_id ON fake_answers(round_id);
      CREATE INDEX IF NOT EXISTS idx_selections_round_id ON selections(round_id);
    `);

    // Create functions
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_games_updated_at
        BEFORE UPDATE ON games
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();

      CREATE TRIGGER update_players_updated_at
        BEFORE UPDATE ON players
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();

      CREATE TRIGGER update_audience_members_updated_at
        BEFORE UPDATE ON audience_members
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();

      CREATE TRIGGER update_rounds_updated_at
        BEFORE UPDATE ON rounds
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();

      CREATE TRIGGER update_cohorts_updated_at
        BEFORE UPDATE ON cohorts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `);

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error); 