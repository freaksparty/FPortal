-- help file for creating SQL DB Structure and user
-- This might be automated in future (at least tables structure)

-- CREATE USER 'PIAMAD'@'localhost' IDENTIFIED BY 'piamadpass';
-- User will be created by "GRANT" if not exists
CREATE SCHEMA IF NOT EXISTS PIAMAD;
GRANT ALL PRIVILEGES ON PIAMAD.* TO 'PIAMAD'@'localhost' IDENTIFIED BY 'piamadpass';

use PIAMAD

drop table if exists Users, Events, EventParticipants;
CREATE TABLE Users (
	_id INT(9) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	user VARCHAR(20) NOT NULL UNIQUE,
	nss INT(12) UNSIGNED,
	name VARCHAR(75),
	email VARCHAR(50) UNIQUE,
	role ENUM('Medic', 'Patient', 'Admin', 'Familiar') NOT NULL DEFAULT 'Patient',
	pass VARCHAR(43),
	creation DATETIME NOT NULL,
	room VARCHAR(25),
	tokenDate DATETIME DEFAULT NULL,
	passToken VARCHAR(12) DEFAULT NULL
) ENGINE = InnoDB;

-- Mysql/Mariadb lacks default now()
CREATE TRIGGER insUser BEFORE INSERT ON Users 
FOR EACH ROW SET NEW.creation = NOW();

-- 	duration TIME NOT NULL,
CREATE TABLE Events (
	_id INT(9) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	owner INT(9) NOT NULL REFERENCES Users(_id),
	patient INT(9) NOT NULL REFERENCES Users(_id),
	start DATETIME NOT NULL,
	duration INTEGER UNSIGNED NOT NULL,
	end DATETIME AS (start + INTERVAL duration MINUTE) PERSISTENT, -- helps with time interval selecting
	comments VARCHAR(150),
	moderated BOOL NOT NULL DEFAULT 0,
	status ENUM('Created', 'MedicIn', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Created'	
) ENGINE = InnoDB;
CREATE TABLE EventParticipants (
	event INT(9) NOT NULL REFERENCES Events(_id),
	user INT(9) NOT NULL REFERENCES Users(_id),
	status ENUM('Invited', 'WontCome', 'Confirmed') NOT NULL DEFAULT 'Invited',
	PRIMARY KEY(event,user)
) ENGINE = InnoDB;

DROP EVENT IF EXISTS closePastEvents;
CREATE EVENT closePastEvents
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP + INTERVAL 1 MINUTE
DO UPDATE PIAMAD.Events SET status = 'Closed' WHERE status = 'MedicIn' AND end < NOW();
