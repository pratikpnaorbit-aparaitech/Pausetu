const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newKeys = {
  en: {
    post: {
      title: "Post Listing",
      subtitle: "Create a new cattle listing or auction for the community."
    }
  },
  hi: {
    post: {
      title: "नई लिस्टिंग बनाएं (Post Listing)",
      subtitle: "समुदाय के लिए एक नई पशुधन लिस्टिंग या नीलामी बनाएं।"
    }
  },
  mr: {
    post: {
      title: "नवीन नोंदणी करा (Post Listing)",
      subtitle: "समुदायासाठी नवीन पशू नोंदणी किंवा लिलाव तयार करा।"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.post) content.post = {};
    Object.assign(content.post, newKeys[lang].post);
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged post translations into ${lang}.json`);
  }
});
