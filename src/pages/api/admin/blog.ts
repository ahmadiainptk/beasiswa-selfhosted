// path: src/pages/api/admin/blog.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { blogPosts, blogCategories, blogTags, blogPostTags } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';
import { createGoogleDoc, setPublicEditPermission, exportDocAsHtml } from '../../../lib/drive';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

// GET — list posts
export const GET: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) return json({ success: false, message: 'Unauthorized' }, 401);

  try {
    const runtime = (locals as any).runtime;
    const db = drizzle(runtime?.env?.DB, { schema });

    const all = await db.select({
      id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug,
      excerpt: blogPosts.excerpt, coverImage: blogPosts.coverImage,
      docId: blogPosts.docId, categoryId: blogPosts.categoryId,
      status: blogPosts.status, publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt, authorId: blogPosts.authorId,
      categoryName: blogCategories.name,
    }).from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .orderBy(desc(blogPosts.createdAt));

    return json({ success: true, posts: all }, 200);
  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};

// POST — create/update/delete/toggle/refresh
export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) return json({ success: false, message: 'Unauthorized' }, 401);

  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;
    const db = drizzle(env?.DB, { schema });
    const body = await request.json();
    const { action } = body;
    const now = new Date().toISOString();

    if (action === 'create-doc') {
      const { title, category_id, tags, excerpt, cover_image } = body;
      if (!title) return json({ success: false, message: 'Judul wajib' }, 400);

      const doc = await createGoogleDoc(title, env);
      await setPublicEditPermission(doc.id, env);

      const finalSlug = 'post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      const result = await db.insert(blogPosts).values({
        title, slug: finalSlug, content: '', docId: doc.id,
        authorId: 1, // placeholder — author from GARDA email
        categoryId: category_id ? parseInt(category_id) : null,
        excerpt: excerpt || null,
        coverImage: cover_image || null,
        status: 'draft', createdAt: now, updatedAt: now,
      }).returning({ id: blogPosts.id });

      const postId = result[0].id;

      if (tags) {
        const tagNames = (tags as string).split(',').map((t: string) => t.trim()).filter(Boolean);
        for (const tagName of tagNames) {
          const tagSlug = slugify(tagName);
          if (!tagSlug) continue;
          let existing = await db.select().from(blogTags).where(eq(blogTags.slug, tagSlug)).limit(1);
          let tagId: number;
          if (existing.length > 0) { tagId = existing[0].id; }
          else { const r = await db.insert(blogTags).values({ name: tagName, slug: tagSlug, createdAt: now }).returning({ id: blogTags.id }); tagId = r[0].id; }
          await db.insert(blogPostTags).values({ postId, tagId });
        }
      }

      return json({ success: true, id: postId, docUrl: doc.url, docId: doc.id }, 201);
    }

    if (action === 'update') {
      const { id, title, slug, excerpt, cover_image, status, category_id, tags } = body;
      if (!id) return json({ success: false, message: 'ID post wajib' }, 400);

      const updates: any = { updatedAt: now };
      if (title !== undefined) updates.title = title;
      if (slug && slug.trim()) updates.slug = slugify(slug);
      if (excerpt !== undefined) updates.excerpt = excerpt;
      if (cover_image !== undefined) updates.coverImage = cover_image;
      if (category_id !== undefined) updates.categoryId = category_id ? parseInt(category_id) : null;
      if (status !== undefined) {
        updates.status = status;
        if (status === 'published') {
          const existing = await db.select({ docId: blogPosts.docId, publishedAt: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
          if (existing.length > 0) {
            if (!existing[0].publishedAt) updates.publishedAt = now;
            if (existing[0].docId) {
              try {
                const html = await exportDocAsHtml(existing[0].docId, env);
                updates.content = html;
              } catch (e: any) {
                return json({ success: false, message: 'Gagal export Google Doc: ' + e.message }, 500);
              }
            }
          }
        }
      }

      await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));

      if (tags !== undefined) {
        await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
        const tagNames = (tags as string).split(',').map(t => t.trim()).filter(Boolean);
        for (const tagName of tagNames) {
          const tagSlug = slugify(tagName);
          if (!tagSlug) continue;
          let existing = await db.select().from(blogTags).where(eq(blogTags.slug, tagSlug)).limit(1);
          let tagId: number;
          if (existing.length > 0) { tagId = existing[0].id; }
          else { const r = await db.insert(blogTags).values({ name: tagName, slug: tagSlug, createdAt: now }).returning({ id: blogTags.id }); tagId = r[0].id; }
          await db.insert(blogPostTags).values({ postId: id, tagId });
        }
      }

      return json({ success: true, message: 'Post berhasil diupdate' }, 200);
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) return json({ success: false, message: 'ID post wajib' }, 400);
      await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      return json({ success: true, message: 'Post berhasil dihapus' }, 200);
    }

    if (action === 'refresh-html') {
      const { id } = body;
      if (!id) return json({ success: false, message: 'ID post wajib' }, 400);
      const rows = await db.select({ docId: blogPosts.docId }).from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (rows.length === 0 || !rows[0].docId) return json({ success: false, message: 'Doc tidak ditemukan' }, 404);
      const html = await exportDocAsHtml(rows[0].docId, env);
      await db.update(blogPosts).set({ content: html, updatedAt: now }).where(eq(blogPosts.id, id));
      return json({ success: true, message: 'HTML refreshed' }, 200);
    }

    if (action === 'toggle-status') {
      const { id } = body;
      if (!id) return json({ success: false, message: 'ID post wajib' }, 400);
      const rows = await db.select({ status: blogPosts.status, docId: blogPosts.docId, publishedAt: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (rows.length === 0) return json({ success: false, message: 'Post tidak ditemukan' }, 404);

      const newStatus = rows[0].status === 'published' ? 'draft' : 'published';
      const updates: any = { status: newStatus, updatedAt: now };

      if (newStatus === 'published') {
        updates.publishedAt = rows[0].publishedAt || now;
        if (rows[0].docId) {
          try {
            const html = await exportDocAsHtml(rows[0].docId, env);
            updates.content = html;
          } catch (e: any) {
            return json({ success: false, message: 'Gagal export Google Doc: ' + e.message }, 500);
          }
        }
      }

      await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));
      return json({ success: true, message: `Status diubah ke ${newStatus}` }, 200);
    }

    return json({ success: false, message: 'Action tidak valid' }, 400);
  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};
