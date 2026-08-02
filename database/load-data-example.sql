USE railline;

-- Example only.
-- Enable LOCAL INFILE in the MySQL client/server before using this pattern.
-- Replace the file path and target table with your local sanitized CSV data.

LOAD DATA LOCAL INFILE '/path/to/sample.csv'
INTO TABLE sample_vector
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(series_id, idx, @value)
SET val = NULLIF(@value, '');

SELECT COUNT(*) FROM sample_vector WHERE series_id = 'S001';
SELECT * FROM sample_vector WHERE series_id = 'S001' ORDER BY idx LIMIT 5;
