import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { mosqueProfile, member } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Fetch mosque profile
	const [profile] = await db.select().from(mosqueProfile).limit(1);

	// Fetch DKM structure (active members with roles)
	// For now, we'll use members with specific keywords in their status or just show some members
	const members = await db.select().from(member).where(eq(member.status, 'active')).limit(8);

	// Default DKM structure if no members found
	const dkmStructure =
		members.length > 0
			? members.slice(0, 4).map((m, i) => ({
					role: ['Ketua DKM', 'Sekretaris', 'Bendahara', 'Koordinator Ibadah'][i] || 'Pengurus',
					name: m.fullName,
					image:
						m.imageUrl ||
						`https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=10b981&color=fff`
				}))
			: [
					{
						role: 'Ketua DKM',
						name: 'H. Ahmad Dahlan',
						image:
							'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=800&auto=format&fit=crop&q=60'
					},
					{
						role: 'Sekretaris',
						name: 'Ustadz Fatih',
						image:
							'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60'
					},
					{
						role: 'Bendahara',
						name: 'Bapak Irwan',
						image:
							'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60'
					},
					{
						role: 'Koordinator Ibadah',
						name: 'Ustadz Zulkifli',
						image:
							'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=60'
					}
				];

	return {
		profile: profile
			? {
					name: profile.name,
					address: profile.address,
					phone: profile.phone,
					email: profile.email,
					website: profile.website,
					vision: profile.vision,
					mission: profile.mission,
					history: profile.history,
					image: profile.imageUrl
				}
			: null,
		dkmStructure
	};
};
