var onTranslating = (el, key, value) => value;

async function loadTranslationsForLocale(localeKey)
{
    try
    {
        var data = await fetch(`https://raw.githubusercontent.com/BitFriendStudios/Character-Editor/main/i18n/${localeKey}.json`);
        var body = await data.json();
        if (!data.ok)
            throw Error(body);
        return body;
    }
    catch (e)
    {
        console.error(`Couldn't load translations for locale ${localeKey}`);
        console.error(e);
        var data = await fetch(`https://raw.githubusercontent.com/BitFriendStudios/Character-Editor/main/i18n/${localeKey}.json`);
        var body = await data.json();
        if (!data.ok)
            throw Error(body);
        return body;
    }
}

function setTranslations(locale, data, default_data)
{
    document.querySelectorAll("[data-i18n]").forEach((el) => translate(el, data, default_data));
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => translatePlaceholders(el, data, default_data));
    document.getElementById('btn-locale').getElementsByTagName('img')[0].classList.value = locale;
}

function setTranslationsFor(el, data, default_data)
{
    translate(el, data, default_data);
    translatePlaceholders(el, data, default_data);
}

function translate(el, data, default_data)
{
    var key = el.getAttribute("data-i18n");
    try
    {
        if (!data[key]) //<- According to javascript 'undefined' or 'null' is the same as 'false'... Who the fuck designed this?!?!?
            throw Error();
        var translation = onTranslating(el, key, data[key]);
        el.innerText = translation;
    }
    catch
    {
        var translation = onTranslating(el, key, default_data[key]);
        el.innerText = translation;
    }
}

function translatePlaceholders(el, data, default_data)
{
    var key = el.getAttribute("data-i18n-placeholder");
    try
    {
        if (!data[key]) 
            throw Error();
        var translation = onTranslating(el, key, data[key]);
        el.setAttribute('placeholder', translation);
    }
    catch
    {
        var translation = onTranslating(el, key, default_data[key]);
        el.setAttribute('placeholder', translation);
    }
}