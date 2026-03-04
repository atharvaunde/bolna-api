const env = [
    'PORT',
    'NODE_ENV',
    'MONGO_URI',
    'BOLNA_API_KEY',
    'PUBLIC_API_URL',
    'BOLNA_AGENT_ID',
    'BOLNA_FROM_NUMBER',
    'BOLNA_AGENT_NAME',
    'BOLNA_ENTITY_NAME',
];

const validateEnv = () => {
    const missing = [];

    env.forEach((key) => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    if (missing.length > 0) {
        console.error('\n ERROR: Missing required environment variables:\n');
        missing.forEach((key) => {
            console.error(`   - ${key}`);
        });
        console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
        process.exit(1);
    }

    console.log('All required environment variables are present\n');
};

module.exports = { validateEnv };