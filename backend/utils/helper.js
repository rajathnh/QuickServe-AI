const crypto = require('crypto');

// Helper function to generate a unique conversation ID using hash
const generateConversationIdHash = (clientId, freelancerId) => {
    const ids = [clientId, freelancerId];
    ids.sort(); // Sort the IDs to avoid order issues
    const hash = crypto.createHash('sha256');
    hash.update(ids.join('-')); // Concatenate the IDs and hash them
    return hash.digest('hex'); // Return the hashed conversation ID
};

module.exports = generateConversationIdHash