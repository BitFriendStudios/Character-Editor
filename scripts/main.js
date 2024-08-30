const BTN_THEME = document.getElementById('btn-theme'),
      DIV_FILEAREA = document.getElementById('file-drop'),
      BTN_FILESELECT = document.getElementById('btn-file-select'),
      INPUT_FILEBOX = document.getElementById('file-box'),
      BTN_NEW_CARD = document.getElementById('btn-new-card');

function dropInFile(evt)
{
    evt.preventDefault();
    if (evt.dataTransfer.items && evt.dataTransfer.items[0])
    {
        var item = evt.dataTransfer.items[0];
        if (item.kind === "file")
        {
            toggleLoader();
            const file = item.getAsFile();
            Serializer.read(file);
            return;
        }
    }
    if (evt.dataTransfer.files && evt.dataTransfer.files[0])
    {
        toggleLoader();
        Serializer.read(evt.dataTransfer.files[0]);
    }
}

function onFileSelected()
{
    if (INPUT_FILEBOX.files && INPUT_FILEBOX.files[0])
    {
        toggleLoader();
        Serializer.read(INPUT_FILEBOX.files[0]);
    }
}

async function createNewCard()
{
    toggleLoader();

    var storageData = {
        'type': Serializer.TYPE_SILLYTAVERN,
        'version': "2.0",
        'image': "",
        'data': JSON.stringify({'data': { "create_date": new Date().toSillyTavernString(new Date()) }})
    };

    await StorageHandler.setIndexed('editing', JSON.stringify(storageData), true);
    await StorageHandler.purgeIndexed('original');
    
    window.location = "editor.html";
}

async function pageLoad()
{
    await updateTranslations();

    BTN_THEME.addEventListener('click', toggleTheme);

    DIV_FILEAREA.addEventListener('dragover', (evt) => evt.preventDefault());
    DIV_FILEAREA.addEventListener('drop', dropInFile);
    BTN_FILESELECT.addEventListener('click', () => INPUT_FILEBOX.click());
    INPUT_FILEBOX.addEventListener('dragover', (evt) => evt.preventDefault());
    INPUT_FILEBOX.addEventListener('change', onFileSelected);

    BTN_NEW_CARD.addEventListener('click', createNewCard);

    document.getElementById('btn-cache-continue').addEventListener('click', () => window.location = "editor.html");
    document.getElementById('btn-cache-delete').addEventListener('click', async () => 
    {
        await StorageHandler.purgeDatabase();
        document.getElementById('db-cache-container').classList.add('hidden');
    });

    document.querySelectorAll('button.btn-locale').forEach((el) => 
    { 
        if (el.id !== "btn-locale") 
            el.addEventListener('click', changeLocale) 
    });
}