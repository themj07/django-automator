const addPrefix = (path, prefix) => {
  const cleanPath = path.trim().replace(/^\/+/, '');
  const cleanPrefix = prefix.trim().replace(/\/$/, '');
  if (!cleanPrefix) return cleanPath;
  if (cleanPath.startsWith(cleanPrefix + '/')) return cleanPath;
  return `${cleanPrefix}/${cleanPath}`;
};

export const processDjangoCode = (code, config) => {
  if (!code) return '';
  let newCode = code;
  
  // 1. Nettoyage des commentaires (Regex corrigée)
  if (config.cleanComments) {
    newCode = newCode.replace(/<!--[\s\S]*?-->/g, '');
  }
  
  // 2. Injection CSRF
  if (config.injectCsrf) {
    newCode = newCode.replace(/(<form\s+[^>]*method=["']?POST["']?[^>]*>)/gi, '$1\n  {% csrf_token %}');
  }
  
  // 3. Conversion URLs
  if (config.convertUrls) {
    newCode = newCode.replace(/href=["']([\w-./]+\.html)["']/g, (match, p1) => {
      const parts = p1.split('/');
      let urlName = parts[parts.length - 1].replace('.html', '');
      if (urlName === 'index') urlName = 'index';
      return `href="{% url '${urlName}' %}"`;
    });
  }
  
  const staticExtensions = ['css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'mp4', 'webm', 'webp'];
  
  // 4. Static files
  if (config.convertStatic) {
    const staticRegex = new RegExp(`(href|src)=["'](?!https?:|#|{|mailto:|tel:|javascript:)([^"']+\\.(${staticExtensions.join('|')}))["']`, 'gi');
    newCode = newCode.replace(staticRegex, (match, attr, path) => {
      const newPath = addPrefix(path, config.staticPrefix);
      return `${attr}="{% static '${newPath}' %}"`;
    });
    
    const cssUrlRegex = new RegExp(`url\\(\\s*['"]?(?!https?:|data:|{|%)([^'"\)]+\\.(${staticExtensions.join('|')}))['"]?\\s*\\)`, 'gi');
    newCode = newCode.replace(cssUrlRegex, (match, path) => {
       const newPath = addPrefix(path, config.staticPrefix);
       return `url("{% static '${newPath}' %}")`;
    });
  }
  return newCode;
};