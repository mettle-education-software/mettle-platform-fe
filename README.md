This is a [Next.js](https://nextjs.org/) project bootstrapped
with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and
load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions
are welcome!

## Best practices

- Configure your editor to auto run prettier on save - it helps a lot
- Use `const` by default, use `let` only when you need to reassign a variable
- Mind the structure of the files and folders for component creation. Every component should be created in its own
  directory.
- Get familiar with the [React](https://react.dev/learn/thinking-in-react) and [Nextjs](https://nextjs.org/docs) best
  practices to optimize efficiency and code quality.
- Use `React.FC` for functional components
- Use `React.Component` for class components
- To make API calls, use the configured api client with react query hooks
- Please follow the atomic design pattern for component creation. If you are not familiar with it, please read about it.
  The atomic design pattern is a methodology for creating design systems and it goes like this:
  - Atoms: Basic building blocks of matter. Examples: a button, a form label, an input
  - Molecules: Groups of atoms bonded together and are the smallest fundamental units of a compound. Examples: a form
    group, a card, a button with an icon
  - Organisms: Groups of molecules joined together to form a relatively complex, distinct section of an interface.
    Examples: a header, a footer, a form

It is important to note that Atoms compose Molecules, Molecules compose Organisms, Organisms compose Layouts and Pages.
You should not create an Atom that uses another Atom or an Atom that uses a Molecule. The same goes for Molecules and
Organisms. This is a good practice to keep the codebase clean and maintainable.

- Use @emotion/styled for styling components - however, if you see fit in any case to create separate CSS files,
  please do so. Use your best judgment. The idea here is for this to go well with the Atomic design by making easy to
  maintain and understand the components without breaking global design.
