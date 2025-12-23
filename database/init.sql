-- Création de la base de données
CREATE DATABASE IF NOT EXISTS madagascar_birdy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utilisation de la base de données
USE madagascar_birdy;

-- Table des témoignages
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    rating INT NOT NULL,
    comment TEXT NOT NULL,
    status ENUM('pending', 'approved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques témoignages initiaux
INSERT INTO testimonials (name, email, location, rating, comment, status) VALUES
('Sarah K.', 'sarah@example.com', 'UK', 5, 'Un voyage inoubliable ! Les guides étaient incroyablement compétents et la faune était magnifique.', 'approved'),
('Thomas M.', 'thomas@example.com', 'France', 4, 'Expérience exceptionnelle. Je recommande vivement Madagascar Birdy pour des vacances uniques.', 'approved'),
('Aisha B.', 'aisha@example.com', 'Canada', 5, 'Service client exceptionnel et itinéraires bien pensés. Nous avons vu des paysages à couper le souffle !', 'approved');
