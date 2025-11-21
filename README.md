# Django Template Automator

Un outil les développeurs Django permettant de gagner du temps.

🔗 [Voir l'application en ligne](https://themj07.github.io/django-automator/)

---

## Fonctionnalités Principales

### 1. Conversion Intelligente

- **Assets Statiques** : Conversion automatique des `src="img.png"` et `href="style.css"` en `{% static '...' %}`.
- **Liens Internes** : Transformation des liens `.html` en balises `{% url '...' %}`.
- **Sécurité** : Injection automatique du token `{% csrf_token %}` dans tous les formulaires POST.

### 2. Mode "Extraction de Base" (Split & Merge)

- Fusion de deux fichiers HTML (p. ex. : `index.html` et `contact.html`) pour détecter les parties communes (Header/Footer).
- Génération automatique d'un fichier `base.html`.
- Nettoyage des fichiers enfants pour ne garder que leur contenu unique et ajouter le `{% extends %}`.

### 3. Outils de Productivité

- **Loop Tool** : Sélectionnez un élément (ex : une carte produit), nommez votre variable, et l'outil génère la boucle `{% for %}` tout en supprimant intelligemment les duplications.
- **Diff Viewer** : Visualisez les changements ligne par ligne (style GitHub) avant de copier le code.
- **Snippets** : Insérez rapidement des blocs d'authentification, date ou commentaires.

---

## Installation locale

```bash
git clone https://github.com/themj07/django-automator.git
cd django-automator
npm install
npm run dev
```
