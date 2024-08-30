const BTN_THEME = document.getElementById('btn-theme'),
      TEMPLATE_ALT_GREETING = document.getElementById('alt_greeting-template'),
      DIV_ALT_GREETINGS_CONTAINER = document.getElementById('alt_greetings-container'),
      BTN_ADD_ALT_GREETING = document.getElementById('btn-add-alt_greeting'),
      BTN_ADD_MESSAGE_EXAMPLE = document.getElementById('btn-add-mes_example'),
      INPUT_FILEBOX = document.getElementById('file-box'),
      DIV_FILEAREA = document.getElementById('file-drop'),
      LABEL_LAST_UPDATED = document.getElementById('updated-label'),
      BTN_ADD_UPDATED = document.getElementById('btn-add-updated'),
      BTN_REMOVE_UPDATED = document.getElementById('btn-remove-updated');

const TimeBeforeAutoSave = 5000; // 5 seconds

let editingObject, originalObject, saveTimeout;

function resizeTextArea(el)
{
    el.style.height = "1px";
    el.style.height = `${((el.scrollHeight / el.rows ) * el.rows) + 5}px`;
}

function addAltGreeting()
{
    var alt_greeting_count = DIV_ALT_GREETINGS_CONTAINER.childElementCount;
    var templateRoot = TEMPLATE_ALT_GREETING.content.querySelector('div');
    var clone = document.importNode(templateRoot, true);
    clone.setAttribute('data-index', alt_greeting_count + 1);
    clone.querySelector('button.btn-advanced-remove').addEventListener('click', removeAltGreeting);
    var inputBox = clone.querySelector('textarea');
    var undoButton = clone.querySelector('button.btn-undo-changes');
    inputBox.setAttribute('data-property', `AltGreetings[${alt_greeting_count}]`);
    inputBox.value = editingObject.GetOrAddAltGreeting(alt_greeting_count);
    inputBox.id = `card-input-alternate_greeting-${alt_greeting_count}`;
    undoButton.setAttribute('data-target', inputBox.id);
    inputBox.addEventListener('keyup', (evt) => 
    {
        resizeTextArea(evt.currentTarget);
        updateValueFor(evt.currentTarget);
        updateUndoButton(evt.currentTarget);
        updateUndoButton(DIV_ALT_GREETINGS_CONTAINER);
    });
    undoButton.addEventListener('click', (evt) => 
    {
        resetField(evt);
        updateUndoButton(DIV_ALT_GREETINGS_CONTAINER);
    });
    DIV_ALT_GREETINGS_CONTAINER.appendChild(clone);
    resizeTextArea(inputBox);
    updateTranslations();
    requestAutoSave();
}

function removeAltGreeting(evt)
{
    var index = typeof evt === 'number' ? evt : -1;
    if (index <= 0)
    {
        var btn = evt.currentTarget;
        var div = btn.parentElement;
        index = div.getAttribute('data-index');
    }

    var elements = DIV_ALT_GREETINGS_CONTAINER.querySelectorAll('div.input-alt_greeting-box');
    for (var i = index - 1; i < elements.length; i++)
    {
        if (i == index - 1)
        {
            editingObject.RemoveAltGreeting(i);
            DIV_ALT_GREETINGS_CONTAINER.removeChild(elements[i]);
            continue;
        }
        elements[i].setAttribute('data-index', i);
        var inputBox = elements[i].querySelector('textarea');
        inputBox.setAttribute('data-property', `AltGreetings[${i}]`);
        elements[i].querySelector('button.btn-undo-changes').setAttribute('data-target', inputBox.id);
    }
    updateUndoButton(DIV_ALT_GREETINGS_CONTAINER);
    updateTranslations();
    requestAutoSave();
}

function addMessageExample()
{
    var input = document.getElementById('card-input-mes_example');
    input.value += "<START>\n{{char}}: \n{{user}}: \n{{char}}: \n{{user}}: \n";
    updateValueFor(input);
    resizeTextArea(input);
    updateUndoButton(input);
}

function interceptTranslation(el, key, value) //I hate this, it's rooted to deep into the DOM tree, if the element this is for changes, it needs to be re-written. Fucking Fix this!
{
    if (key === "card-alt_greeting-label")
    {
        var index = el.parentElement.parentElement.getAttribute('data-index');
        if (!index)
            return value;
        value = value.format(value, index);
    }

    return value;
}

function updateValueFor(el)
{
    if (el === DIV_ALT_GREETINGS_CONTAINER)
    {
        editingObject.AltGreetings = [...originalObject.AltGreetings];
        editingObject.AltGreetings.forEach(addAltGreeting);
    }
    var property = el.getAttribute('data-property');
    var index = -1;
    if (/[A-z0-9]+\[[0-9]{1,}\]/.test(property)) //Example: AltGreetings[0]
    {
        index = Number(property.split('[')[1].replace(']', ''));
        property = property.split('[')[0];
    }
    var value = el.value;

    if (index >= 0)
        editingObject[property][index] = value;
    else
        editingObject[property] = value;
    requestAutoSave();
}

function dropInFile(evt)
{
    evt.preventDefault();
    let file;
    if (evt.dataTransfer.items && evt.dataTransfer.items[0])
    {
        var item = evt.dataTransfer.items[0];
        if (item.kind === "file")
            file = item.getAsFile();
    }
    else if (evt.dataTransfer.files && evt.dataTransfer.files[0])
        file = evt.dataTransfer.files[0];

    if (!file)
        return;

    if (file.type.startsWith('image'))
    {
        updateImage(file);
        return;
    }
    console.error(`Invalid File, Check if the file type is a valid image file`);
}

function onFileSelected()
{
    if (INPUT_FILEBOX.files && INPUT_FILEBOX.files[0])
    {
        const file = INPUT_FILEBOX.files[0];
        if (file.type.startsWith('image'))
        {
            updateImage(file);
            return;
        }
        console.error(`Invalid File, Check if the file type is a valid image file`);
    }
}

function setUpdated()
{
    var dt = new Date();
    var hadLastUpdated = editingObject.UpdatedAt;
    editingObject.UpdatedAt = dt.toMetadataString(dt);
    LABEL_LAST_UPDATED.innerHTML = editingObject.UpdatedAt;
    requestAutoSave();
    if (hadLastUpdated)
        return;
    BTN_ADD_UPDATED.setAttribute('data-i18n', 'btn.update-updated');
    LABEL_LAST_UPDATED.classList.remove('hidden');
    BTN_REMOVE_UPDATED.classList.remove('hidden');
    updateTranslations();
}

function unsetUpdated()
{
    var hadLastUpdated = editingObject.UpdatedAt;
    editingObject.UpdatedAt = null;
    LABEL_LAST_UPDATED.innerHTML = "";
    if (!hadLastUpdated) //Shouldn't happen, but I don't even trust myself to be honest
        return;
    BTN_ADD_UPDATED.setAttribute('data-i18n', 'btn.add-updated');
    LABEL_LAST_UPDATED.classList.add('hidden');
    BTN_REMOVE_UPDATED.classList.add('hidden');
    updateTranslations();
    requestAutoSave();
}

function resetField(evt)
{
    var source = evt.currentTarget;
    var target = source.getAttribute('data-target');
    var targetEl = document.getElementById(target);
    if (targetEl === DIV_ALT_GREETINGS_CONTAINER)
        targetEl.innerHTML = "";
    else
        targetEl.value = getOriginalValueFor(targetEl.getAttribute('data-property'));
    updateValueFor(targetEl);
    updateUndoButton(targetEl);
    if (targetEl.type === 'textarea')
        resizeTextArea(targetEl);
    requestAutoSave();
}

function updateUndoButton(el)
{
    var target = document.querySelector(`button.btn-undo-changes[data-target="${el.id}"]`);
    if (el === DIV_ALT_GREETINGS_CONTAINER)
    {
        for (var i=0; i<originalObject.AltGreetings.length; i++)
        {
            if (i >= editingObject.AltGreetings.length || editingObject.AltGreetings[i] !== originalObject.AltGreetings[i])
            {
                target.classList.remove('hidden');
                return;
            }
        }
        if (!target.classList.contains('hidden'))
            target.classList.add('hidden');
        return;
    }
    var origValue = getOriginalValueFor(el.getAttribute('data-property'));
    if (el.value !== origValue)
        target.classList.remove('hidden');
    else if (!target.classList.contains('hidden'))
        target.classList.add('hidden');
}

function getOriginalValueFor(property)
{
    var index = -1;
    if (/[A-z0-9]+\[[0-9]{1,}\]/.test(property))
    {
        index = Number(property.split('[')[1].replace(']', ''));
        property = property.split('[')[0];
    }
    if (index >= 0)
        return originalObject[property][index];
    else
        return originalObject[property];
}

function requestAutoSave(delay = TimeBeforeAutoSave)
{
    if (saveTimeout)
        clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => 
    {
        await saveDetails();
        var box = document.getElementById('save-info-display');
        box.classList.remove('hidden');
        setTimeout(() => box.classList.add('hidden'), 500);
        clearTimeout(saveTimeout);
    }, delay);
}

async function updateImage(img)
{
    editingObject.Image = await Serializer.readBlobData(img).catch(reason => console.error(reason));
    var exportBtn = document.querySelector('button.btn-export[data-export="png"]');
    if (!editingObject.Image)
    {
        exportBtn.disabled = true;
        return;
    }
    var imgPreview = document.getElementsByClassName('card-img-preview')[0];
    imgPreview.setAttribute('src', editingObject.Image);
    imgPreview.setAttribute('alt', editingObject.Name);
    DIV_FILEAREA.querySelector('p').setAttribute('data-i18n', 'change-image');
    await updateTranslations();
    exportBtn.disabled = false;
}

async function downloadCard(evt)
{
    var target = evt.currentTarget;
    var exportType = target.getAttribute('data-export');

    await saveDetails();

    if (exportType == "png" && !editingObject.Image)
    {
        console.warn("[Max] As if bud, get out of the console, and don't touch my code");
        exportType = "json";
    }

    var url = await Serializer.write(`${editingObject.Name}.${exportType}`, JSON.parse(await StorageHandler.getIndexed('editing', true)), exportType);
    var el = document.createElement('a');
    el.href = url;
    el.download = `${editingObject.Name}.${exportType}`;
    el.click();
    window.URL.revokeObjectURL(url);
}

async function saveDetails()
{
    try
    {
        await StorageHandler.setIndexed('original', originalObject.ToString(), true);
        await StorageHandler.setIndexed('editing', editingObject.ToString(), true);
    }
    catch(err)
    {
        console.error(err);
    }
}

async function loadCardData()
{
    let editingStr = await StorageHandler.getIndexed('editing', true);
    if (!editingStr)
        window.location = 'index.html';

    let editing = JSON.parse(editingStr);
    editing["data"] = JSON.parse(editing["data"]);
    let original = await StorageHandler.getIndexed('original', true);

    if (original)
    {
        original = JSON.parse(original);
        original["data"] = JSON.parse(original["data"]);
    }
    else
    {
        original = JSON.parse(editingStr);
        original["data"] = JSON.parse(original["data"]);
    }

    editingObject = new CardData(editing);
    originalObject = new CardData(original);
}

async function pageLoad()
{
    toggleLoader();

    await updateTranslations();
    onTranslating = interceptTranslation;

    await loadCardData();

    window.addEventListener('beforeunload', saveDetails);
    window.addEventListener('keydown', (evt) => 
    {
        if (evt.key == 's' && evt.ctrlKey)
        {
            evt.preventDefault();
            requestAutoSave(0);
        }
    });

    BTN_THEME.addEventListener('click', toggleTheme);

    document.querySelectorAll('button.btn-locale').forEach((el) => 
    {
        if (el.id !== 'btn-locale')
            el.addEventListener('click', changeLocale);
    });

    if (editingObject.Image)
    {
        var preview = document.getElementsByClassName('card-img-preview')[0];
        preview.setAttribute('src', editingObject.Image);
        preview.setAttribute('alt', editingObject.Name);
    }
    else
    {
        DIV_FILEAREA.querySelector('p').setAttribute('data-i18n', 'select-image');
        updateTranslations(DIV_FILEAREA.querySelector('p'));
    }

    document.querySelectorAll("[data-property]").forEach((el) => el.value = editingObject[el.getAttribute("data-property")]);

    document.querySelectorAll("textarea").forEach((el) => 
    {
        el.addEventListener('keyup', (evt) => 
        {
            resizeTextArea(evt.currentTarget);
            updateValueFor(evt.currentTarget);
        });
        resizeTextArea(el);
    });

    document.querySelectorAll('input[type="text"]').forEach((el) => el.addEventListener('keyup', (evt) => updateValueFor(evt.currentTarget)));

    new ResizeObserver(() => { document.querySelectorAll("textarea").forEach(resizeTextArea); }).observe(document.getElementsByTagName('body')[0]);

    BTN_ADD_ALT_GREETING.addEventListener('click', addAltGreeting);
    BTN_ADD_MESSAGE_EXAMPLE.addEventListener('click', addMessageExample);

    DIV_FILEAREA.addEventListener('click', () => INPUT_FILEBOX.click());
    DIV_FILEAREA.addEventListener('dragover', (evt) => evt.preventDefault());
    DIV_FILEAREA.addEventListener('drop', dropInFile);
    INPUT_FILEBOX.addEventListener('change', onFileSelected);

    BTN_ADD_UPDATED.addEventListener('click', setUpdated);
    BTN_REMOVE_UPDATED.addEventListener('click', unsetUpdated);

    if (editingObject.UpdatedAt)
    {
        BTN_ADD_UPDATED.setAttribute('data-i18n', 'btn.update-updated');
        LABEL_LAST_UPDATED.innerHTML = editingObject.UpdatedAt;
        LABEL_LAST_UPDATED.classList.toggle('hidden');
        BTN_REMOVE_UPDATED.classList.toggle('hidden');
        updateTranslations(BTN_ADD_UPDATED);
    }

    document.getElementById('created-label').innerHTML = editingObject.CreatedAt;

    document.querySelectorAll('button.btn-undo-changes').forEach((el) => 
    {
        var target = document.getElementById(el.getAttribute('data-target'));
        if (target !== DIV_ALT_GREETINGS_CONTAINER)
            target.addEventListener('keyup', (evt) => updateUndoButton(evt.currentTarget));
        updateUndoButton(target);
        el.addEventListener('click', resetField);
    });

    document.querySelectorAll('button.btn-export').forEach((el) => el.addEventListener('click', downloadCard));
    
    var exportBtn = document.querySelector('button.btn-export[data-export="png"]');
    if (!editingObject.Image)
        exportBtn.disabled = true;

    editingObject.AltGreetings.forEach(addAltGreeting);

    toggleLoader();
}