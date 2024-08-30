function toggleLoader()
{
    document.getElementsByClassName("overlay")[0].classList.toggle('hidden');
}

function toggleTheme()
{
    var curTheme = document.documentElement.getAttribute('data-bs-theme');

    if (curTheme !== 'dark')
    {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        StorageHandler.setLocal('env.theme', 'dark');
        return;
    }
    document.documentElement.setAttribute('data-bs-theme', 'light');
    StorageHandler.setLocal('env.theme', 'light');
}


function changeLocale(evt)
{
    var curLang = StorageHandler.getLocal('env.locale');
    var el = evt.currentTarget;
    if (!el)
        return;
    var locale = el.getAttribute('data-locale');
    if (locale === curLang)
        return;
    document.documentElement.lang = locale;
    StorageHandler.setLocal('env.locale', locale);
    updateTranslations();
}

async function updateTranslations(el)
{
    var curLang = StorageHandler.getLocal('env.locale') ?? document.documentElement.lang;

    var translations = await loadTranslationsForLocale(curLang);
    var default_translations = await loadTranslationsForLocale('en-US');

    if (typeof el !== "undefined")
    {
        setTranslationsFor(el, translations, default_translations);
        return;
    }

    setTranslations(curLang, translations, default_translations);
}

//https://stackoverflow.com/a/31466357
function formatNumber(num) { return num.toLocaleString(undefined, {minimumIntegerDigits: 2, useGrouping: false}); }

Date.prototype.toMetadataString = (date) =>
{
    return `${date.getFullYear()}-${formatNumber(date.getMonth() + 1)}-${formatNumber(date.getDate())}T${formatNumber(date.getHours())}:${formatNumber(date.getMinutes())}:${formatNumber(date.getSeconds())}`;
}

Date.prototype.toSillyTavernString = (date) => 
{
    return `${date.getFullYear()}-${formatNumber(date.getMonth() + 1)}-${formatNumber(date.getDate())} @${formatNumber(date.getHours())}h ${formatNumber(date.getMinutes())}m ${formatNumber(date.getSeconds())}s ${date.getMilliseconds()}ms`;
}

String.prototype.format = (template, ...args) => 
{
    return template.replace(/\{[0-9]{1,}\}/g, (match) => 
    {
        var index = Number(match.replace('{', '').replace('}', ''));
        return typeof args[index] === 'undefined' ? match : args[index];
    });
}