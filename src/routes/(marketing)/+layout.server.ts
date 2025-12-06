export const load = async ({ locals }) => {
	return {
		profile: locals.user
	};
};
