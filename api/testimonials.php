<?php
// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// En-têtes CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Credentials: true");

// Répondre immédiatement aux requêtes OPTIONS (prévol)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Inclure la configuration de la base de données
require_once __DIR__ . '/../config/database.php';

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fonction pour envoyer une réponse JSON
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Récupérer la méthode de la requête
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Traitement selon la méthode de la requête
    switch ($method) {
        case 'GET':
            // Récupérer les témoignages approuvés
            $stmt = $conn->prepare("SELECT id, name, location, rating, comment, created_at 
                                  FROM testimonials  
                                  ORDER BY created_at DESC");
            $stmt->execute();
            $result = $stmt->get_result();
            
            $testimonials = [];
            while ($row = $result->fetch_assoc()) {
                $testimonials[] = $row;
            }
            
            sendResponse([
                'success' => true,
                'data' => $testimonials
            ]);
            break;
            
        case 'POST':
            // Récupérer les données du formulaire (support à la fois JSON et form-data)
            $contentType = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';
            
            if (strpos($contentType, 'application/json') !== false) {
                // Si les données sont au format JSON
                $content = trim(file_get_contents("php://input"));
                $data = json_decode($content, true);
            } else {
                // Si les données sont au format form-data
                $data = $_POST;
            }
            
            // Journalisation pour débogage
            error_log('Données reçues : ' . print_r($data, true));
            
            // Validation des données
            $errors = [];
            $name = trim($data['name'] ?? '');
            $email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
            $location = trim($data['location'] ?? '');
            $rating = filter_var($data['rating'] ?? 0, FILTER_VALIDATE_INT, [
                'options' => ['min_range' => 1, 'max_range' => 5]
            ]);
            $comment = trim($data['comment'] ?? '');
            
            // Vérification des champs obligatoires
            if (empty($name)) $errors[] = 'Le nom est requis';
            if (!$email) $errors[] = 'Une adresse email valide est requise';
            if (!$rating) $errors[] = 'Une note valide est requise (1-5)';
            if (empty($comment)) $errors[] = 'Le commentaire est requis';
            
            if (!empty($errors)) {
                sendResponse([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $errors
                ], 400);
            }
            
            // Préparation de la requête d'insertion
            $stmt = $conn->prepare("INSERT INTO testimonials 
                                  (name, email, location, rating, comment) 
                                  VALUES (?, ?, ?, ?, ?)");
            
            $stmt->bind_param('sssis', $name, $email, $location, $rating, $comment);
            
            if (!$stmt->execute()) {
                throw new Exception('Erreur lors de l\'enregistrement du témoignage');
            }
            
            sendResponse([
                'success' => true,
                'message' => 'Merci pour votre témoignage ! Il sera publié après modération.',
                'id' => $stmt->insert_id
            ], 201);
            
            break;
            
        default:
            sendResponse([
                'success' => false,
                'message' => 'Méthode non autorisée'
            ], 405);
    }
    
} catch (Exception $e) {
    // Journaliser l'erreur (à adapter selon votre configuration)
    error_log('Erreur API témoignages: ' . $e->getMessage());
    
    sendResponse([
        'success' => false,
        'message' => 'Une erreur est survenue sur le serveur',
        'error' => $e->getMessage()
    ], 500);
}

// Fermer la connexion
$conn->close();
?>
