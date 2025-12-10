import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { db } from '$lib/server/db';
import { protectedRoute } from '$lib/server/db/schema';


const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

// --- 2. Rate Limit Middleware ---
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Requests per window
const ipRequests = new Map<string, { count: number; reset: number }>();

const handleRateLimit: Handle = async ({ event, resolve }) => {
	const ip = event.getClientAddress();
	const now = Date.now();

	let record = ipRequests.get(ip);

	// Reset if window expired
	if (!record || now > record.reset) {
		record = { count: 0, reset: now + RATE_LIMIT_WINDOW };
		ipRequests.set(ip, record);
	}

	// Check limit
	if (record.count >= MAX_REQUESTS) {
		return new Response('Too Many Requests', {
			status: 429,
			headers: {
				'Retry-After': Math.ceil((record.reset - now) / 1000).toString()
			}
		});
	}

	record.count++;
	return resolve(event);
};

// --- 3. Session Validation Middleware ---
const handleSession: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

// --- 4. Role Check Middleware (RBAC) ---
// --- 4. Role Check Middleware (RBAC) ---
// Cache mechanism
let cachedRoutes: { prefix: string; roles: string[] }[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getProtectedRoutes() {
	const now = Date.now();
	if (!cachedRoutes || now - lastFetch > CACHE_TTL) {
		// Fetch from DB
		const routes = await db.select().from(protectedRoute);
		// Map to simpler structure if needed, but schema matches
		cachedRoutes = routes.map((r) => ({ prefix: r?.prefix, roles: r?.roles }));
		lastFetch = now;
	}
	return cachedRoutes;
}

const cekRole: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const route = event.route.id;

	// 1. Admin Specific Rules
	if (route && route.startsWith('/(app)')) {
		if (!event.locals.user) {
			return Response.redirect(new URL('/', event.url), 303);
		}
		if (!event.locals.user.emailVerified) {
			return Response.redirect(new URL('/verify-email', event.url), 303);
		}
	}

	// 2. Dynamic Protected Routes (RBAC)
	const protectedRoutes = await getProtectedRoutes();

	// Find matching route (longest prefix match)
	const sortedRoutes = [...protectedRoutes].sort((a, b) => b.prefix.length - a.prefix.length);
	const protectedRoute = sortedRoutes.find((route) => path.startsWith(route.prefix));

	if (protectedRoute) {
		// Check authentication
		if (!event.locals.user) {
			return Response.redirect(new URL('/', event.url), 303);
		}

		// Check role
		if (!protectedRoute.roles.includes(event.locals.user.role)) {
			return new Response('Forbidden: You do not have permission to access this resource.', {
				status: 403
			});
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleParaglide, handleRateLimit, handleSession, cekRole);
