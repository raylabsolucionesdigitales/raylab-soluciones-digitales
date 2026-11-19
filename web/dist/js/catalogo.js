/* Independent catalogue: no global site scripts, tracking or external requests. */
document.getElementById('print-catalog').addEventListener('click', async () => {
  await document.fonts.ready;
  await Promise.all(Array.from(document.images, image => image.decode().catch(() => {})));
  window.print();
});
