// src/utils/djangoAdminGenerator.js

// Analyse un fichier models.py et retourne une liste de modèles
export function parseModelsFile(source) {
  if (!source) return [];

  const lines = source.split('\n');
  const models = [];

  let currentModel = null;
  let currentIndent = null;

  const classRegex = /^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*:/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détection d'une classe de modèle
    const classMatch = line.match(classRegex);
    if (classMatch) {
      const name = classMatch[1];
      const bases = classMatch[2];

      if (!/models\.Model/.test(bases)) {
        // Pas un modèle Django
        currentModel = null;
        currentIndent = null;
        continue;
      }

      currentModel = { name, fields: [] };
      models.push(currentModel);

      const indentMatch = line.match(/^\s*/);
      currentIndent = (indentMatch ? indentMatch[0].length : 0) + 4; // on suppose 4 espaces
      continue;
    }

    if (!currentModel) continue;

    const indent = (line.match(/^\s*/) || [''])[0].length;
    const trimmed = line.trim();

    // Sortie du bloc de la classe
    if (trimmed && !trimmed.startsWith('@') && indent < currentIndent) {
      currentModel = null;
      currentIndent = null;
      continue;
    }

    // Détection d'un champ simple sur une ligne
    const fieldMatch =
      line.match(/^\s*(\w+)\s*=\s*models\.([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/);

    if (fieldMatch) {
      const [, fieldName, fieldType, argsPart] = fieldMatch;

      const field = {
        name: fieldName,
        type: fieldType,
        rawArgs: argsPart,
        rawLine: line,
        isRelation: ['ForeignKey', 'OneToOneField', 'ManyToManyField'].includes(fieldType),
        isAutoField: /AutoField/.test(fieldType) || /primary_key\s*=\s*True/.test(argsPart),
        isBoolean:
          fieldType === 'BooleanField' || fieldType === 'NullBooleanField',
        isDateLike: /DateField|DateTimeField|TimeField/.test(fieldType),
        isCharLike: /CharField|TextField|EmailField|SlugField|UUIDField/.test(fieldType),
        hasAutoNow:
          /auto_now\s*=\s*True/.test(argsPart) ||
          /auto_now_add\s*=\s*True/.test(argsPart),
      };

      if (field.isRelation) {
        // On essaie de récupérer le modèle cible : premier argument
        let relArg = argsPart.split(',')[0].trim();
        relArg = relArg.replace(/models\./, '');
        relArg = relArg.replace(/^['"]|['"]$/g, '');
        field.relatedModel = relArg;
      }

      currentModel.fields.push(field);
    }
  }

  return models;
}

// Construit le code admin pour un modèle donné
function buildAdminForModel(model, cfg) {
  const adminName = `${model.name}Admin`;

  const listDisplay = [];
  if (cfg.includeListDisplay) {
    model.fields.forEach((f) => {
      if (f.name === 'id') {
        listDisplay.unshift('id');
      } else if (!f.isAutoField || f.isRelation) {
        listDisplay.push(f.name);
      }
    });
  }
  const trimmedListDisplay = listDisplay.slice(
    0,
    cfg.maxListDisplay || listDisplay.length
  );

  const searchFields = [];
  if (cfg.includeSearchFields) {
    model.fields.forEach((f) => {
      if (f.isCharLike) searchFields.push(f.name);
    });
  }

  const listFilter = [];
  if (cfg.includeListFilter) {
    model.fields.forEach((f) => {
      if (f.isBoolean || f.isDateLike || f.isRelation) {
        listFilter.push(f.name);
      }
    });
  }

  const readonlyFields = [];
  if (cfg.includeReadOnlyAutoFields) {
    model.fields.forEach((f) => {
      if (f.isAutoField || f.hasAutoNow) readonlyFields.push(f.name);
    });
  }

  let prepopulatedLine = null;
  if (cfg.includePrepopulatedSlug) {
    const slugField = model.fields.find(
      (f) => f.name === 'slug' || f.type === 'SlugField'
    );
    if (slugField) {
      const sourceField =
        model.fields.find((f) => ['name', 'title', 'label'].includes(f.name)) ||
        model.fields.find((f) => f.isCharLike && f.name !== slugField.name);
      if (sourceField) {
        prepopulatedLine = `    prepopulated_fields = {'${slugField.name}': ('${sourceField.name}',)}`;
      }
    }
  }

  const hasAnyOption =
    trimmedListDisplay.length ||
    searchFields.length ||
    listFilter.length ||
    readonlyFields.length ||
    prepopulatedLine ||
    cfg.includeOrdering;

  const lines = [];

  if (cfg.useDecorators) {
    lines.push(`@admin.register(${model.name})`);
    lines.push(`class ${adminName}(admin.ModelAdmin):`);
  } else {
    lines.push(`class ${adminName}(admin.ModelAdmin):`);
  }

  if (!hasAnyOption) {
    lines.push('    pass');
  } else {
    if (trimmedListDisplay.length) {
      lines.push(
        `    list_display = (${trimmedListDisplay
          .map((f) => `'${f}'`)
          .join(', ')},)`
      );
    }
    if (listFilter.length) {
      lines.push(
        `    list_filter = (${listFilter.map((f) => `'${f}'`).join(', ')},)`
      );
    }
    if (searchFields.length) {
      lines.push(
        `    search_fields = (${searchFields
          .map((f) => `'${f}'`)
          .join(', ')},)`
      );
    }
    if (cfg.includeOrdering && trimmedListDisplay.length) {
      lines.push(`    ordering = ('${trimmedListDisplay[0]}',)`);
    }
    if (readonlyFields.length) {
      lines.push(
        `    readonly_fields = (${readonlyFields
          .map((f) => `'${f}'`)
          .join(', ')},)`
      );
    }
    if (prepopulatedLine) {
      lines.push(prepopulatedLine);
    }
  }

  if (!cfg.useDecorators) {
    lines.push('');
    lines.push(`admin.site.register(${model.name}, ${adminName})`);
  }

  return lines.join('\n');
}

// Génère le contenu complet d'un admin.py à partir du code models.py
export function generateAdminFromModels(modelsSource, options = {}) {
  const cfg = {
    useDecorators: true,
    includeListDisplay: true,
    maxListDisplay: 5,
    includeSearchFields: true,
    includeListFilter: true,
    includeOrdering: true,
    includeReadOnlyAutoFields: true,
    includePrepopulatedSlug: true,
    ...options,
  };

  const models = parseModelsFile(modelsSource);

  if (!models.length) {
    return (
      "# Aucun modèle Django détecté.\n" +
      "# Assure-toi d'avoir des classes `class MyModel(models.Model):`.\n"
    );
  }

  const importsLine =
    'from django.contrib import admin\nfrom .models import ' +
    models.map((m) => m.name).join(', ') +
    '\n\n';

  const bodies = models.map((m) => buildAdminForModel(m, cfg)).join('\n\n');

  return importsLine + bodies + '\n';
}
