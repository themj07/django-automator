# Django Template Automator

Un outil Open Source pour les développeurs Django permettant de convertir **instantanément** des templates HTML statiques en gabarits Django prêts à l'emploi.

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
git clone https://github.com/votre-nom/django-automator.git
cd django-automator
npm install
npm run dev
```

---

## Contribution & Open Source

Ce projet est **Open Source** et gratuit pour la communauté.

Les contributions sont les bienvenues : corrections de bugs, nouvelles fonctionnalités (support Jinja2, autres frameworks), améliorations UI, etc.

1. **Forkez** le projet
2. **Créez votre branche** (`git checkout -b feature/AmazingFeature`)
3. **Commitez** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Poussez** la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez une Pull Request**

---

## Contributeurs

<a href="https://github.com/themj07/django-automator/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=themj07/django-automator" />
</a>

<a href="https://github.com/Yann-26/Yann-26/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Yann-26/Yann-26" />
</a>

<a href="https://github.com/yvescape /Odoo_agrinova/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=yvescape/Odoo_agrinova" />
</a>

## 📄 Licence

Distribué sous la licence **MIT**.








