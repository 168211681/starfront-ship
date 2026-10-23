import { defineConfig, Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function importGraphManifestPlugin(): Plugin {
  const modules: Array<{ id: string; importedIds: string[] }> = [];
  return {
    name: 'starfront-import-graph-manifest',
    buildEnd() {
      modules.length = 0;
      for (const id of this.getModuleIds()) {
        const info = this.getModuleInfo(id);
        if (info && !id.startsWith('\0')) {
          modules.push({
            id,
            importedIds: info.importedIds.filter((imp) => !imp.startsWith('\0'))
          });
        }
      }
    },
    writeBundle(options) {
      const outDir = options.dir || path.resolve(process.cwd(), 'dist');
      fs.mkdirSync(outDir, { recursive: true });
      const manifestPath = path.join(outDir, 'build-import-graph.json');
      const threeModules = modules.filter((m) => m.id.includes('/node_modules/three/'));
      const customShimModules = modules.filter((m) => m.id.includes('three-webgl2'));
      fs.writeFileSync(
        manifestPath,
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            totalModules: modules.length,
            threeModuleCount: threeModules.length,
            customShimModuleCount: customShimModules.length,
            usesOfficialThree: threeModules.length > 0 && customShimModules.length === 0,
            threeModules: threeModules.map((m) => m.id),
            modules
          },
          null,
          2
        ),
        'utf8'
      );
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [importGraphManifestPlugin()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  test: {
    environment: 'node'
  }
});
