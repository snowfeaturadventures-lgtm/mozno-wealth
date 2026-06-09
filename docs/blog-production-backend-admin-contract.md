# Blog Production Backend/Admin Contract

This frontend now calls production API endpoints for newsletter subscription,
blog likes, and blog views. The backend/admin repositories are not present in
this checkout, so the server and admin changes must be implemented there with
the contract below.

## Newsletter Subscribers

### Database

Create a `NewsletterSubscriber` collection/table:

- `email`: string, required, lowercase, unique index
- `source`: string, example `blog_detail`
- `blogId`: string/ObjectId, optional
- `blogSlug`: string, optional
- `status`: enum `active | unsubscribed`, default `active`
- `createdAt`: date
- `updatedAt`: date

### Public API

`POST /api/newsletter/subscribe`

Request body:

```json
{
  "email": "reader@example.com",
  "source": "blog_detail",
  "blogId": "blog-id",
  "blogSlug": "blog-slug"
}
```

Validation:

- Reject invalid email with `400`.
- Normalize email to lowercase.
- Prevent duplicates using a unique database index.
- Duplicate active subscriber should return `200` with a friendly message.

Response body:

```json
{
  "success": true,
  "message": "Subscribed successfully",
  "subscriber": {
    "email": "reader@example.com",
    "status": "active"
  }
}
```

### Admin

Add a newsletter/subscribers screen with:

- Subscriber email
- Source
- Related blog title/slug when available
- Status
- Created date
- Search/filter/export

## Blog Author Fields

### Blog Database Fields

Each blog should expose:

- `author.name`
- `author.role` or `authorRole`
- `author.image` or `authorImage`
- `author.bio` or `authorBio`

### Admin

Blog create/edit form should include:

- Author Name
- Author Designation
- Author Image
- Author Bio

These values must be returned in `GET /api/blogs/:slug`.

## Blog Likes

### Database

Blog fields:

- `likes`: number, default `0`

Optional anti-abuse collection:

- `blogId`
- `visitorId` or `userId`
- `createdAt`

### Public API

`POST /api/blogs/:blogId/like`

Behavior:

- Persist like count in database.
- Return updated blog or updated count.
- If anonymous visitors can like only once, identify them with server-side
  visitor/session fingerprinting or user auth.

Response body:

```json
{
  "success": true,
  "liked": true,
  "likes": 91
}
```

## Blog Views

### Database

Blog fields:

- `views`: number, default `0`

Optional view events collection:

- `blogId`
- `visitorHash`
- `ipHash`
- `userAgentHash`
- `createdAt`

### Public API

`POST /api/blogs/:blogId/view`

Request body:

```json
{
  "slug": "blog-slug"
}
```

Behavior:

- Increment persisted `views`.
- De-dupe repeated views server-side within a reasonable window.
- Return updated view count or blog.

Response body:

```json
{
  "success": true,
  "views": 1246
}
```

## Comment Counts

`GET /api/blogs/comments/:blogId` should return either:

- all comments with nested `replies`, allowing the frontend to count nested
  replies, or
- `totalComments` that already includes nested replies.

After `POST /api/blogs/add-comment`, backend should update blog `commentCount`
or return enough data for the frontend to refetch comments and blog detail.
