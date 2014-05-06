--help file for creating SQL DB Structure and user
--This might be automated in future (at least tables structure)

create user 'PIAMAD'@'localhost' identified by 'piamadpass';
create schema if not exists PIAMAD;
grant all privileges on PIAMAD.* to 'PIAMAD'@'localhost';

use PIAMAD

drop table if exists Users, Events; --,table1,table2...
CREATE TABLE Users (
	_id INT(9) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	user VARCHAR(20) NOT NULL UNIQUE,
	name VARCHAR(75),
	email VARCHAR(50) UNIQUE,
	role ENUM('Medic', 'Patient', 'Admin', 'Familiar') NOT NULL DEFAULT 'Patient',
	pass VARCHAR(43),
	creation DATETIME NOT NULL,
	room VARCHAR(25) DEFAULT NULL
) ENGINE = InnoDB;

--Mysql/Mariadb lacks default now()
CREATE TRIGGER insUser BEFORE INSERT ON Users 
FOR EACH ROW SET NEW.creation = NOW();

CREATE TABLE Events (
	_id INT(9) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	owner INT(9) NOT NULL REFERENCES Users(_id),
	patient INT(9) NOT NULL REFERENCES Users(_id),
	start DATETIME NOT NULL,
	duration TIME NOT NULL,
	comments VARCHAR(150),
	status ENUM('Created', 'MedicIn', 'Closed') DEFAULT 'Created'	
) ENGINE = InnoDB;
CREATE TABLE EventParticipants (
	event INT(9) NOT NULL REFERENCES Events(_id),
	user INT(9) NOT NULL REFERENCES Users(_id),
	PRIMARY(event,user)
) ENGINE = InnoDB;
