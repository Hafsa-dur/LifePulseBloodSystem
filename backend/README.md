# VitalTrack backend email configuration

The About Us contact form sends a request to `POST /api/contact`. The backend sends that message through Nodemailer using the configured sender account and sets the visitor's email as `replyTo`.

Set these variables in the backend deployment environment:

```text
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
CONTACT_EMAIL_TO=
```

`CONTACT_EMAIL_TO` is the support or project recipient for contact messages. It is currently a configurable fixed recipient; it is not automatically routed to a Hospital Admin.

`EMAIL_PASSWORD`, `EMAIL_USER`, and other values must remain server-side. Do not place them in frontend environment variables or commit populated `.env` files.
