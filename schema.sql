CREATE TABLE IF NOT EXISTS domains
(
	domain      TEXT NOT NULL PRIMARY KEY,
	description TEXT NOT NULL,
	link        TEXT
);

CREATE TABLE IF NOT EXISTS constants
(
	domain      TEXT NOT NULL,
	name        TEXT NOT NULL,
	value       TEXT NOT NULL,
	hex_value   TEXT,
	tags        TEXT,
	description TEXT NOT NULL,
	link        TEXT,

	PRIMARY KEY (domain, name),
	FOREIGN KEY (domain) REFERENCES domains (domain) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS constants_domain_idx ON constants (domain);
CREATE INDEX IF NOT EXISTS constants_domain_value_idx ON constants (domain, value);
