import { createBrainwaveApp } from "./bootstrap";

async function bootstrap() {
  const { nestApp } = await createBrainwaveApp();
  const port = Number(process.env.PORT || 3001);
  await nestApp.listen(port);
  console.log(`Brainwave API is listing on port :${port}`);
}

bootstrap();
