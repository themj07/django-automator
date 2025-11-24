import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Tu es un expert Django.
Analyse le prompt utilisateur et réponds EXCLUSIVEMENT avec un OBJET JSON valide (aucun texte additionnel).
Le JSON doit suivre le schéma :
{
  "models": [
    {
      "name": "ModelName",
      "fields": [
        { "name":"field_name", "type":"CharField|TextField|IntegerField|BooleanField|ForeignKey|ManyToManyField|DecimalField|DateField|DateTimeField|EmailField|URLField|ImageField|FileField", "target":"RelatedModelName (si relation)", "options": { "max_length":255, "null": true } }
      ]
    }
  ]
}
`;

// --------- utils ----------
function extractJson(text) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1) return null;
    return text.slice(first, last + 1);
}

function stringifyOptionValue(v) {
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (v === null) return 'None';
    if (typeof v === 'number') return String(v);
    return `'${String(v)}'`;
}

function buildFieldCode(field) {
    const name = field.name || 'field';
    const type = field.type || 'CharField';
    const options = field.options || {};
    const optionsParts = [];
    for (const [k, v] of Object.entries(options)) {
        if (k === 'default' && typeof v === 'string') {
            if (/\w+\(.*\)/.test(v)) optionsParts.push(`${k}=${v}`);
            else optionsParts.push(`${k}=${stringifyOptionValue(v)}`);
        } else {
            optionsParts.push(`${k}=${stringifyOptionValue(v)}`);
        }
    }

    if (type === 'ForeignKey') {
        const target = field.target ? field.target : 'self';
        const optStr = optionsParts.join(', ');
        return `${name} = models.ForeignKey(${target}${optStr ? ', ' + optStr : ''})`;
    }
    if (type === 'ManyToManyField') {
        const target = field.target ? field.target : 'self';
        const optStr = optionsParts.join(', ');
        return `${name} = models.ManyToManyField(${target}${optStr ? ', ' + optStr : ''})`;
    }

    const optStr = optionsParts.join(', ');
    return `${name} = models.${type}(${optStr})`;
}

// --------- builders ----------
export function buildModelsCode(parsedModels) {
    const models = parsedModels || [];
    if (!models.length) return '# Aucun modèle détecté';

    let out = "from django.db import models\n\n";

    for (const m of models) {
        const name = m.name || 'Model';
        out += `class ${name}(models.Model):\n`;

        if (!Array.isArray(m.fields) || m.fields.length === 0) {
            out += "    title = models.CharField(max_length=255)\n";
        } else {
            for (const f of m.fields) {
                out += '    ' + buildFieldCode(f) + '\n';
            }
        }

        const displayField = (m.fields || []).find(f => /CharField|TextField/i.test(f.type))?.name || 'id';
        out += `\n    def __str__(self):\n        return str(self.${displayField})\n\n`;
        out += `    class Meta:\n        verbose_name = "${name}"\n        verbose_name_plural = "${name}s"\n\n`;
    }

    return out;
}

export function buildViewsAndUrls(parsedModels, appName, viewOptions = { list: true, detail: true, create: true, update: true, delete: true }) {
    if (!Array.isArray(parsedModels) || parsedModels.length === 0) {
        return { viewsCode: '# Aucun modèle détecté', urlsCode: '# Aucun modèle détecté' };
    }

    const imports = `from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView\nfrom django.urls import reverse_lazy\nfrom ${appName}.models import ${parsedModels.map(m => m.name).join(', ')}\n\n`;
    let views = imports;
    let routes = 'urlpatterns = [';

    for (const m of parsedModels) {
        const lower = m.name.toLowerCase();
        const fieldNames = (m.fields || []).filter(f => f.type !== 'ForeignKey' && f.type !== 'ManyToManyField').map(f => `'${f.name}'`).join(', ') || "'id'";
        const success = `reverse_lazy('${lower}_list')`;

        if (viewOptions.list) {
            views += `class ${m.name}ListView(ListView):\n    model = ${m.name}\n    template_name = '${appName}/${lower}_list.html'\n    context_object_name = '${lower}_list'\n\n`;
        }
        if (viewOptions.detail) {
            views += `class ${m.name}DetailView(DetailView):\n    model = ${m.name}\n    template_name = '${appName}/${lower}_detail.html'\n    context_object_name = '${lower}'\n\n`;
        }
        if (viewOptions.create) {
            views += `class ${m.name}CreateView(CreateView):\n    model = ${m.name}\n    fields = [${fieldNames}]\n    template_name = '${appName}/${lower}_form.html'\n    success_url = ${success}\n\n`;
        }
        if (viewOptions.update) {
            views += `class ${m.name}UpdateView(UpdateView):\n    model = ${m.name}\n    fields = [${fieldNames}]\n    template_name = '${appName}/${lower}_form.html'\n    success_url = ${success}\n\n`;
        }
        if (viewOptions.delete) {
            views += `class ${m.name}DeleteView(DeleteView):\n    model = ${m.name}\n    template_name = '${appName}/${lower}_confirm_delete.html'\n    success_url = ${success}\n\n`;
        }

        // urls
        if (viewOptions.list) routes += `\n    path('${lower}/', ${m.name}ListView.as_view(), name='${lower}_list'),`;
        if (viewOptions.detail) routes += `\n    path('${lower}/<int:pk>/', ${m.name}DetailView.as_view(), name='${lower}_detail'),`;
        if (viewOptions.create) routes += `\n    path('${lower}/create/', ${m.name}CreateView.as_view(), name='${lower}_create'),`;
        if (viewOptions.update) routes += `\n    path('${lower}/update/<int:pk>/', ${m.name}UpdateView.as_view(), name='${lower}_update'),`;
        if (viewOptions.delete) routes += `\n    path('${lower}/delete/<int:pk>/', ${m.name}DeleteView.as_view(), name='${lower}_delete'),`;
    }

    routes += '\n]';

    return {
        viewsCode: views,
        urlsCode: `from django.urls import path\nfrom .views import *\n\n${routes}`
    };
}

export async function askOpenAIForModels(promptText) {
    if (!promptText) throw new Error('Prompt vide');
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Génère la définition JSON des modèles Django pour : ${promptText}` }
    ];

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1200,
        temperature: 0.0
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Réponse vide de l'IA");
    const jsonText = extractJson(raw);
    if (!jsonText) throw new Error("Impossible d'extraire du JSON valide de la réponse IA.");
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed.models)) parsed.models = [];
    return parsed;
}
