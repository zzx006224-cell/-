(() => {
    const data = window.IIUM_CONTACTS;
    const list = document.querySelector('#contacts-list');
    const search = document.querySelector('#contacts-search');
    const chips = [...document.querySelectorAll('[data-category]')];
    const cards = [];
    let category = 'all';
    let toastTimer;
    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function externalLink(text, url, className) {
        const link = element('a', text + ' ↗', className);
        link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', text + '（新标签页打开）');
        return link;
    }
    function showSource(parent, source) {
        parent.append(source ? externalLink('官方来源 · ' + source.title, source.url, 'contact-source') : element('span', '用户提供 · 暂未通过官方来源确认', 'contact-source user-source'));
    }
    function copyButton(value, isBank = false) {
        const button = element('button', isBank ? '复制账号' : '复制邮箱');
        button.type = 'button'; button.dataset.copy = value;
        button.dataset.kind = isBank ? 'bank' : 'email';
        button.setAttribute('aria-label', (isBank ? '复制银行账号 ' : '复制邮箱 ') + value);
        return button;
    }
    function emailRow(item) {
        const row = element('div', '', 'email-row');
        row.append(element('p', item.label, 'email-label'), element('span', item.address, 'email-address'));
        const actions = element('div', '', 'contact-actions');
        const mail = element('a', '发送邮件');
        mail.href = 'mailto:' + item.address;
        mail.setAttribute('aria-label', '发送邮件至 ' + item.address);
        actions.append(copyButton(item.address), mail); row.append(actions);
        showSource(row, item.source);
        return row;
    }
    function heading(card, item) {
        const title = element('div', '', 'contact-heading');
        const icon = element('span', item.icon || '↗', 'contact-icon');
        icon.setAttribute('aria-hidden', 'true');
        const names = element('div');
        if (item.abbr) names.append(element('span', item.abbr, 'contact-abbr'));
        names.append(element('h3', item.nameZh)); title.append(icon, names); card.append(title);
        const english = element('p', item.nameEn, 'contact-en'); english.lang = 'en'; card.append(english);
        if (item.description) card.append(element('p', item.description, 'contact-description'));
    }
    function contactCard(item) {
        const card = element('article', '', 'contact-card');
        heading(card, item);
        const special = item.emails.filter(email => email.specialist);
        item.emails.filter(email => !email.specialist).forEach(email => card.append(emailRow(email)));
        if (special.length) {
            const details = element('details', '', 'specialist-emails');
            details.append(element('summary', '学院内部专项邮箱'));
            special.forEach(email => details.append(emailRow(email)));
            card.append(details);
        }
        if (item.note) card.append(element('p', item.note, 'contact-note'));
        return card;
    }
    function linkCard(item) {
        const card = element('article', '', 'contact-card link-card'); heading(card, item);
        card.append(element('p', item.displayDomain, 'link-domain'));
        const actions = element('div', '', 'contact-actions');
        actions.append(externalLink(item.button, item.url)); card.append(actions);
        if (item.source) showSource(card, item.source);
        card.append(element('small', item.note, 'external-label'));
        return card;
    }
    function bankCard(item) {
        const card = element('article', '', 'contact-card bank-card');
        card.append(element('h3', item.bankName));
        const fields = element('dl');
        fields.append(element('dt', 'Account Number / 账号号码'), element('dd', item.account)); card.append(fields);
        const actions = element('div', '', 'contact-actions'); actions.append(copyButton(item.account, true)); card.append(actions);
        card.append(element('p', item.reminder, 'payment-warning'), element('p', item.notice, 'payment-warning'), element('p', '用户提供的银行信息 · 账号未作官方核验', 'bank-source'));
        return card;
    }
    const sections = [
        ['department-contacts', '学校部门邮箱', 'Department Contacts', 'departments'],
        ['faculty-contacts', '学院邮箱', 'Kulliyyah & Centre Contacts', 'faculties'],
        ['useful-links', '常用网站', 'Useful IIUM Links', 'links'],
        ['bank-transfer', '银行转账', 'Bank Transfer', 'payment']
    ];
    const groups = [['students','常用学生服务'],['offices','学校办公室'],['centres','中心与服务'],['institutes','研究所'],['other-campus','其他校区 / Foundation']];
    function addCards(parent, items, render) {
        const grid = element('div', '', 'contacts-grid');
        for (const item of items) {
            const card = render(item); card.dataset.id = item.id;
            const terms = [item.nameZh, item.nameEn, item.abbr || '', item.description || '', ...(item.keywords || []), ...(item.emails || []).flatMap(email => [email.address, email.label]), item.bankName || '', item.account || '', item.displayDomain || ''];
            cards.push({item, card, text: terms.join(' ').toLowerCase()}); grid.append(card);
        }
        parent.append(grid);
    }
    for (const [id, zh, en, cat] of sections) {
        const section = element('section', '', 'contacts-section'); section.id = id;
        const title = element('h2', zh); title.id = id + '-title'; section.setAttribute('aria-labelledby', title.id);
        section.append(title, element('p', en, 'section-english'));
        if (cat === 'departments') {
            for (const [groupId, label] of groups) {
                const group = element('div', '', 'contacts-group'); group.append(element('h3', label));
                addCards(group, data.contacts.filter(item => item.category === cat && item.group === groupId), contactCard);
                section.append(group);
            }
        } else if (cat === 'faculties') addCards(section, data.contacts.filter(item => item.category === cat), contactCard);
        else if (cat === 'links') addCards(section, data.links, linkCard);
        else section.append(bankCard(data.bank));
        list.append(section);
        if (cat === 'payment') {
            const card = section.querySelector('article'); card.dataset.id = data.bank.id;
            cards.push({item:data.bank, card, text:[data.bank.bankName, data.bank.account, data.bank.nameZh, data.bank.nameEn, ...data.bank.keywords].join(' ').toLowerCase()});
        }
    }
    function filter() {
        const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        let count = 0;
        for (const {item, card, text} of cards) {
            card.hidden = !(category === 'all' || item.category === category) || !words.every(word => text.includes(word));
            if (!card.hidden) count++;
            const details = card.querySelector('details');
            if (details && words.length) details.open = (item.emails || []).filter(email => email.specialist).some(email => words.every(word => (email.address + ' ' + email.label).toLowerCase().includes(word)));
            else if (details) details.open = false;
        }
        list.querySelectorAll('.contacts-group, .contacts-section').forEach(section => {
            section.hidden = !section.querySelector('article:not([hidden])');
        });
        document.querySelector('#contacts-count').textContent = '显示 ' + count + ' 项服务';
        document.querySelector('#contacts-empty').hidden = count !== 0;
    }
    search.addEventListener('input', filter);
    chips.forEach(chip => chip.addEventListener('click', () => {
        category = chip.dataset.category;
        chips.forEach(button => button.setAttribute('aria-pressed', String(button === chip)));
        filter();
    }));
    list.addEventListener('click', async event => {
        const button = event.target.closest('button[data-copy]');
        if (!button) return;
        const value = button.dataset.copy;
        const label = button.textContent;
        button.disabled = true;
        let copied = false;
        try { await navigator.clipboard.writeText(value); copied = true; } catch {
            const field = element('textarea'); field.value = value;
            field.style.position = 'fixed'; field.style.opacity = '0';
            const focus = document.activeElement;
            document.body.append(field); field.select();
            try { copied = document.execCommand('copy'); } catch { copied = false; }
            field.remove(); if (focus) focus.focus({preventScroll:true});
        }
        const toast = document.querySelector('#contacts-toast');
        toast.textContent = copied ? (button.dataset.kind === 'bank' ? '已复制银行账号' : '已复制邮箱') : '复制失败，请手动选择内容复制';
        toast.hidden = false; clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
        if (copied) button.textContent = '已复制 ✓';
        setTimeout(() => { button.textContent = label; button.disabled = false; }, copied ? 1800 : 0);
    });
    const emailCount = cat => new Set(data.contacts.filter(item => item.category === cat).flatMap(item => item.emails.map(email => email.address.toLowerCase()))).size;
    document.querySelector('#contacts-stats').textContent = '部门邮箱 ' + emailCount('departments') + ' 个 · 学院邮箱 ' + emailCount('faculties') + ' 个 · 常用网站 ' + data.links.length + ' 个';
    const updated = document.querySelector('#contacts-updated'); updated.textContent = data.updatedAt; updated.dateTime = data.updatedAt;
    filter();
})();
