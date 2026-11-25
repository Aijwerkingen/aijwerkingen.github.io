// Alias target for the production build. next.config.ts points the post page's
// EditPostButton import here when NEXT_PUBLIC_BLOG_EDITOR is not "1", so the
// editor - and the ~524 KB Tiptap chunk it pulls in - is never part of the
// production module graph. Nothing renders it either way.
//
// Why an alias and not just the flag: a build-time flag cannot remove a module
// from the graph. An ES import - static or dynamic - registers the module before
// any flag can be folded, so production emitted the editor and its Tiptap chunk
// even though nothing displayed them. Replacing the module at resolve time is
// the only point at which it can actually be dropped. Measurements are recorded
// in docs/BLOG_EDITOR_PLAN.md, section 6.2.
//
// The signature must match src/admin/blog-editor/EditPostButton.tsx, so the prop
// is accepted and deliberately unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- mirrors the real signature
export function EditPostButton(_props: { slug: string }) {
  return null;
}
