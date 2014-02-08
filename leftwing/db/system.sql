SET storage_engine=INNODB;
DROP DATABASE IF EXISTS leftwing;
CREATE DATABASE leftwing CHARACTER SET utf8 COLLATE utf8_general_ci;
USE leftwing;
# ------------------------------------------------------------------------------
CREATE TABLE languages(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    shortcut    VARCHAR(2)      NOT NULL,
    label       VARCHAR(50)     NOT NULL,
    available   BOOLEAN         NOT NULL,
    UNIQUE (label),
    UNIQUE (shortcut)
);

INSERT INTO languages (shortcut, label, available) VALUES
('en', 'English', TRUE),
('de', 'German', TRUE),
('it', 'Italian', TRUE);
# ------------------------------------------------------------------------------
CREATE TABLE phrasecategories(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    label       VARCHAR(255)    NOT NULL,
    
    UNIQUE(label)
);
INSERT INTO phrasecategories(label) VALUES
("language label");
# ------------------------------------------------------------------------------
CREATE TABLE phrases(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    category    INT UNSIGNED NOT NULL,
    content     VARCHAR(255)    NOT NULL,
    hint        VARCHAR(255),
    
    FOREIGN KEY(category) REFERENCES phrasecategories(id) ON DELETE RESTRICT,
    
    UNIQUE (category, content, hint)
);

INSERT INTO phrases (category, content) VALUES
(1, 'English'),
(1, 'German'),
(1, 'Italian');
# ------------------------------------------------------------------------------
CREATE TABLE translations(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    language    INT UNSIGNED    NOT NULL,
    phrase      INT UNSIGNED    NOT NULL,
    content     VARCHAR(255)    NOT NULL,
    
    FOREIGN KEY (language)  REFERENCES languages(id)    ON DELETE RESTRICT,
    FOREIGN KEY (phrase)    REFERENCES phrases(id)      ON DELETE CASCADE,
    
    UNIQUE (language, phrase)
);
INSERT INTO translations(language, phrase, content) VALUES
(1, 1, 'English'),
(1, 2, 'German'),
(1, 3, 'Italian'),
(2, 1, 'Englisch'),
(2, 2, 'Deutsch'),
(2, 3, 'Italienisch'),
(3, 1, 'Inglese'),
(3, 2, 'Tedesco'),
(3, 3, 'Italiano');

# ------------------------------------------------------------------------------
CREATE TABLE customers(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    shortcut    VARCHAR(255)    NOT NULL,
    label       VARCHAR(255)    NOT NULL,
    comment     VARCHAR(255),
    
    UNIQUE (shortcut)
);
INSERT INTO customers(shortcut, label) VALUES('leftWING', 'leftWING association');
# ------------------------------------------------------------------------------
CREATE TABLE applications(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    customer    INT UNSIGNED    NOT NULL,
    shortcut    VARCHAR(255)    NOT NULL,
    label       VARCHAR(255)    NOT NULL,
    directory   VARCHAR(255)    NOT NULL,
    comment     VARCHAR(255),
    
    FOREIGN KEY (customer) REFERENCES customers(ID) ON DELETE RESTRICT,
    
    UNIQUE (customer, shortcut)
);
INSERT INTO applications(customer, shortcut, label, directory) VALUES
(1, 'admin', 'leftWING Administration', 'leftWINGroot/admin');
# ------------------------------------------------------------------------------
CREATE TABLE users(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    parent      INT UNSIGNED,
    language    INT UNSIGNED    NOT NULL,
    label       VARCHAR(255)    NOT NULL,
    uname       VARCHAR(50)     NOT NULL,
    upass       VARCHAR(32)     NOT NULL,
    data        TEXT,
    
    foreign key(language) REFERENCES languages(id) ON DELETE RESTRICT,
    
    UNIQUE (label),
    UNIQUE (uname)
);

INSERT INTO users (parent, language, label, uname, upass) VALUES
(NULL, 1, 'root', 'root', MD5('giro2002'));
# ------------------------------------------------------------------------------
CREATE TABLE groups(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    customer    INT UNSIGNED    NOT NULL,
    label       VARCHAR(255)    NOT NULL,
    comment     VARCHAR(255),
    
    FOREIGN KEY (customer) REFERENCES customers(id) ON DELETE RESTRICT,
    
    UNIQUE (customer, label)
);
# ------------------------------------------------------------------------------
CREATE TABLE usergroups(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    _user       INT UNSIGNED    NOT NULL,
    _group      INT UNSIGNED    NOT NULL,
    
    FOREIGN KEY (_user)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (_group)    REFERENCES groups(id) ON DELETE RESTRICT,
    
    UNIQUE (_user, _group)
);
# ------------------------------------------------------------------------------
CREATE TABLE systems(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    label       VARCHAR(255)    NOT NULL,
    directory   VARCHAR(255)    NOT NULL,
    
    UNIQUE (label)
);
INSERT INTO systems(label, directory) VALUES('lw', 'leftWINGroot/system');
# ------------------------------------------------------------------------------
CREATE TABLE privileges(

    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    system      INT UNSIGNED    NOT NULL,
    label       VARCHAR(255)    NOT NULL,
    
    FOREIGN KEY (system) REFERENCES systems(id) ON DELETE RESTRICT,
    
    UNIQUE (label)
);
# ------------------------------------------------------------------------------
CREATE TABLE groupprivileges(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    _group      INT UNSIGNED    NOT NULL,
    privilege   INT UNSIGNED    NOT NULL,
    
    FOREIGN KEY (_group)     REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (privilege)  REFERENCES privileges(id) ON DELETE RESTRICT,
    
    UNIQUE (_group, privilege)
);
# ------------------------------------------------------------------------------
CREATE TABLE sessions(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    language    INT UNSIGNED NOT NULL,
    user        INT UNSIGNED,
    lastrequest DATETIME NOT NULL,
    data        TEXT,
    
    foreign key(language) REFERENCES languages(id) ON DELETE RESTRICT,
    foreign key(user) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX(lastrequest)
);
CREATE TABLE sessionlogins(
    
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    session     INT UNSIGNED NOT NULL,
    application INT UNSIGNED NOT NULL,
    
    UNIQUE(session, application),
    
    FOREIGN KEY (session) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (application) REFERENCES applications(id) ON DELETE CASCADE
);













