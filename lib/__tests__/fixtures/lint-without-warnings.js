// Given input the plugin rejects, an accept case passes only if `loadLint` took effect.
export default async () => ({
	results: [{ warnings: [], parseErrors: [], invalidOptionWarnings: [] }],
});
