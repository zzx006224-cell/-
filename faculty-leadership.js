(() => {
    const faculties = window.FACULTY_LEADERSHIP;
    const list = document.querySelector('#faculty-list');
    const search = document.querySelector('#faculty-search');
    const count = document.querySelector('#faculty-count');
    const empty = document.querySelector('#faculty-empty');
    const roles = [ ['dean', 'Dean / 院长'], ['deputy-dean', 'Deputy Dean / 副院长'], ['head', 'Department Heads / 系主任'], ['management', '学院管理人员'] ];
    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function webUrl(value) {
        if (!value) return null;
        try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
    }
    function link(parent, text, value) {
        const url = webUrl(value);
        if (!url) return;
        const node = element('a', text);
        node.href = url; node.target = '_blank'; node.rel = 'noopener noreferrer'; parent.append(node);
    }
    let toastTimer;
    async function copyEmail(value) {
        let copied = false;
        try { await navigator.clipboard.writeText(value); copied = true; } catch {
            const field = element('textarea'); field.value = value; field.style.position = 'fixed'; field.style.opacity = '0';
            const focus = document.activeElement;
            document.body.append(field); field.select();
            try { copied = document.execCommand('copy'); } catch { copied = false; }
            field.remove(); focus.focus();
        }
        const toast = document.querySelector('#directory-toast');
        toast.textContent = copied ? '已复制' : '复制失败，请手动选择邮箱复制'; toast.hidden = false;
        clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
    }
    function personCard(person, faculty) {
        const card = element('article', '', 'person-card');
        const photo = webUrl(person.photo);
        if (photo) { const img = element('img', '', 'person-photo'); img.src = photo; img.alt = person.name || ''; img.loading = 'lazy'; card.append(img); }
        if (person.name) card.append(element('h4', person.name));
        const fields = element('dl');
        for (const [label, value] of [['职位', person.position], ['学院', faculty.abbreviation], ['Department', person.department], ['Email', person.email], ['办公室', person.office], ['联系电话', person.phone], ['最后更新时间 / Last updated', person.updatedAt]]) {
            if (!value) continue;
            const row = element('div'); row.append(element('dt', label), element('dd', value)); fields.append(row);
        }
        card.append(fields);
        const actions = element('div', '', 'person-actions');
        if (person.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) {
            const copy = element('button', '复制邮箱'); copy.type = 'button'; copy.addEventListener('click', () => copyEmail(person.email));
            const email = element('a', '发送邮件'); email.href = 'mailto:' + encodeURIComponent(person.email); actions.append(copy, email);
        }
        link(actions, '查看学院官网', faculty.website);
        link(actions, '查看官方资料', person.sourceUrl);
        if (actions.childElementCount) card.append(actions);
        return card;
    }
    if (!Array.isArray(faculties)) {
        count.textContent = '资料加载失败，请刷新页面重试。'; return;
    }
    faculties.forEach(faculty => {
        const card = element('details', '', 'faculty-card'); card.id = 'faculty-' + faculty.id;
        const summary = element('summary');
        const heading = element('div', '', 'faculty-heading'); heading.append(element('h2', faculty.abbreviation));
        if (faculty.name) heading.append(element('p', faculty.name));
        const people = Array.isArray(faculty.people) ? faculty.people : [];
        const arrow = element('span', '⌄', 'faculty-arrow'); arrow.setAttribute('aria-hidden', 'true');
        summary.append(heading, arrow);
        if (!people.length) summary.append(element('span', '资料整理中', 'status'));
        const content = element('div', '', 'faculty-content');
        if (!people.length) content.append(element('p', '负责人及联系方式资料整理中，暂未提供人员信息。'));
        for (const [key, label] of roles) {
            const group = element('section', '', 'faculty-group'); group.append(element('h3', label));
            const matching = people.filter(person => person.role === key);
            if (matching.length) {
                const grid = element('div', '', 'people-grid'); matching.forEach(person => grid.append(personCard(person, faculty))); group.append(grid);
            } else if (key !== 'management') { group.append(element('span', '资料整理中', 'status')); } else { continue; }
            content.append(group);
        }
        if (faculty.office) content.append(element('p', '学院办公室：' + faculty.office));
        link(content, '查看学院官网', faculty.website);
        if (faculty.updatedAt) content.append(element('p', '最后更新时间 / Last updated：' + faculty.updatedAt));
        card.append(summary, content);
        // 搜索沿用简单文本筛选；只筛选用户已提供的数据，不推断缺失的人员资料。
        card.dataset.search = [faculty.abbreviation, faculty.name, ...people.flatMap(person => [person.name, person.position, person.department, roles.find(role => role[0] === person.role)?.[1]])].filter(Boolean).join(' ').toLowerCase();
        list.append(card);
    });
    function filter() {
        const query = search.value.trim().toLowerCase();
        let visible = 0;
        list.querySelectorAll('.faculty-card').forEach(card => {
            card.hidden = query !== '' && !card.dataset.search.includes(query);
            if (!card.hidden) visible++;
        });
        count.textContent = visible + ' 个学院 · ' + (faculties.every(faculty => !faculty.people?.length) ? '负责人资料整理中' : '仅展示已录入资料');
        empty.hidden = visible !== 0;
    }
    search.addEventListener('input', filter);
    filter();
})();
