# Subir Raylab a GitHub

El repositorio principal está en la raíz `AGENCIA DIGITAL`, con rama `main`. Contiene la web y el agente. El historial anterior de la web permanece localmente y no se publica como submódulo.

## Crear el repositorio remoto

1. Abre https://github.com/new con tu cuenta.
2. Nombre sugerido: `raylab-soluciones-digitales`.
3. Selecciona **Private**.
4. Deja desmarcados README, licencia y `.gitignore`: ya existen archivos locales.
5. Pulsa **Create repository** y copia la URL HTTPS.

Desde la terminal, estando en `AGENCIA DIGITAL`:

```bash
git remote add origin https://github.com/TU_USUARIO/raylab-soluciones-digitales.git
git push -u origin main
```

Sustituye `TU_USUARIO` por tu cuenta. Si Git solicita autenticación, completa el inicio de sesión que abra en el navegador; no pegues contraseñas ni tokens en los archivos.

## Guardar cambios posteriores

```bash
git status
git add .
git commit -m "Describe el cambio"
git push
```

En VS Code selecciona el repositorio de la raíz `AGENCIA DIGITAL`; puede aparecer también el historial antiguo de `sites/raylab`.

`.gitignore` excluye los secretos, dependencias, cachés, entregables de `output/`, capturas y la carpeta antigua duplicada `sites/raylio/`. Los PDF comerciales y logos necesarios sí se guardan. El ejemplo vacío `.dev.vars.example` puede compartirse; las variables reales deben permanecer fuera de Git.

GitHub guarda código: no guarda las conversaciones D1, archivos R2, credenciales, configuraciones del panel de Cloudflare ni borradores del navegador. Esos datos necesitan respaldos separados. Subir código no despliega automáticamente la web ni el agente.
