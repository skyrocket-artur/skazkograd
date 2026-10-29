# Проверка ударений в озвучке (см. README, раздел «Ударения»).
# Для каждого многосложного слова строим варианты произношения с ударением на каждый слог
# (ударная гласная полная и может быть долгой, безударная редуцирована: о→а/ə, е→и, я→и)
# и смотрим, какой вариант лучше объясняет звук (CTC-оценка фонемного распознавателя wav2vec2).
#   .venv/bin/python tools/stress_check.py [id ...] [--thr 1.5] [-v]
import sys, os, re, json, math, argparse, subprocess
import numpy as np
import torch
from huggingface_hub import snapshot_download
from transformers import Wav2Vec2ForCTC

MODEL = 'facebook/wav2vec2-xlsr-53-espeak-cv-ft'
MD = snapshot_download(MODEL, allow_patterns=['*.json', '*.bin'])
VOC = json.load(open(os.path.join(MD, 'vocab.json')))
INV = {v: k for k, v in VOC.items()}
_model = None
def model():
    global _model
    if _model is None:
        _model = Wav2Vec2ForCTC.from_pretrained(MD).eval()
    return _model
def load(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).copy()
    return (x - x.mean()) / (x.std() + 1e-7)
def logprobs(path):
    x = torch.from_numpy(load(path))[None]
    with torch.no_grad():
        lg = model()(x).logits[0]
    return torch.log_softmax(lg, -1)
def greedy(lp):
    ids = lp.argmax(-1).tolist(); out = []; prev = -1
    for i, t in enumerate(ids):
        if t != prev and t != 0: out.append((INV[t], round(i * 0.02, 2)))
        prev = t
    return out

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ACC = '\u0301'
VOW = 'аеёиоуыэюя'

def load_lines():
    s = open(os.path.join(ROOT, 'js/lines.js'), encoding='utf8').read()
    return dict(re.findall(r"(\w+):\s*'([^']*)'", s))

def load_dict():
    d = {}
    for ln in open(os.path.join(ROOT, 'tools/stress.txt'), encoding='utf8'):
        if ln.startswith('#'): continue
        for w in ln.split():
            w = w.lstrip('!')  # «!» — знак уходит в озвучку; для проверки неважно
            d[w.replace(ACC, '').lower()] = w.lower()
    return d

UNSTRESSED_MONO = set('в к с у о об от до по за на из без под над не ни и а но да же ли бы'.split())

def stress_index(word, d):
    """Индекс ударной гласной (среди гласных) или None для безударного односложного."""
    lw = word.lower()
    vs = [i for i, ch in enumerate(lw) if ch in VOW]
    if not vs: return None, 0
    if ACC in lw:  # знак прямо в тексте
        pos = lw.index(ACC) - 1
        clean = lw.replace(ACC, '')
        vs = [i for i, ch in enumerate(clean) if ch in VOW]
        return vs.index(pos), len(vs)
    if 'ё' in lw: return vs.index(lw.index('ё')), len(vs)
    if len(vs) == 1: return (None if lw in UNSTRESSED_MONO else 0), 1
    m = d.get(lw)
    if not m: raise KeyError(word)
    pos = m.index(ACC) - 1
    return vs.index(pos), len(vs)

# Наборы фонем модели (с весами). Ключ: (буква, ударная?)
def S(*toks, low=()):
    d = {t: 0.0 for t in toks}
    for t in low: d[t] = math.log(0.25)
    return d
LONG = {'a': 'aː', 'o': 'oː', 'e': 'eː', 'i': 'iː', 'u': 'uː', 'ɨ': 'ɨː', 'ɛ': 'ɛː', 'ɔ': 'ɔː'}
def VS(full, low=(), long_w=None):
    """Набор с весами. long_w — вес долгих вариантов (ударная гласная длиннее)."""
    d = {t: 0.0 for t in full}
    for t in low: d.setdefault(t, math.log(0.25))
    if long_w is not None:
        for t in list(d):
            if t in LONG: d.setdefault(LONG[t], math.log(long_w) + d[t])
    return d
V_SETS = {
    ('а', True): VS(('a', 'ɑ', 'ä', 'a5'), low=('ʌ', 'ɐ'), long_w=1),
    ('а', False): VS(('a', 'ɐ', 'ʌ', 'ə'), low=('ɑ', 'ɪ'), long_w=0.2),
    ('о', True): VS(('o', 'ɔ', 'o̞'), low=('ʊ',), long_w=1),
    ('о', False): VS(('a', 'ɐ', 'ʌ', 'ə'), low=('o', 'ɑ'), long_w=0.2),
    ('ё', True): VS(('o', 'ɔ', 'o̞', 'ɵ'), long_w=1),
    ('е', True): VS(('e', 'ɛ', 'e̞'), low=('ja', 'je'), long_w=1),
    ('е', False): VS(('i', 'ɪ', 'ᵻ', 'ɨ'), low=('e', 'ə'), long_w=0.2),
    ('э', True): VS(('e', 'ɛ', 'e̞'), long_w=1),
    ('э', False): VS(('ɪ', 'ɨ', 'e', 'ɛ', 'ᵻ'), long_w=0.2),
    ('и', True): VS(('i', 'ɪ', 'ɨ'), long_w=1),
    ('и', False): VS(('i', 'ɪ', 'ɨ'), long_w=0.2),
    ('ы', True): VS(('ɨ', 'i', 'ɪ', 'ᵻ', 'y', 'ɯ'), long_w=1),
    ('ы', False): VS(('ɨ', 'i', 'ɪ', 'ᵻ', 'y', 'ɯ'), long_w=0.2),
    ('у', True): VS(('u', 'ʊ', 'ʉ', 'y'), long_w=1),
    ('у', False): VS(('u', 'ʊ', 'ʉ', 'y'), long_w=0.2),
    ('ю', True): VS(('u', 'ʉ', 'ʊ', 'ju', 'y'), long_w=1),
    ('ю', False): VS(('u', 'ʉ', 'ʊ', 'ju', 'y'), long_w=0.2),
    ('я', True): VS(('a', 'ja', 'æ', 'ä'), long_w=1),
    ('я', False): VS(('ɪ', 'i', 'ə'), low=('e', 'a'), long_w=0.2),
}
# Гласная + й: распознаватель часто выдаёт дифтонг одним символом (oɪ, aɪ, eɪ)
DIPH = {
    ('о', True): {'oɪ': 0.0, 'ɔɪ': 0.0}, ('о', False): {'əɪ': 0.0, 'aɪ': 0.0, 'oɪ': math.log(0.35)},
    ('а', True): {'aɪ': 0.0, 'ai': 0.0}, ('а', False): {'aɪ': 0.0, 'əɪ': 0.0},
    ('я', True): {'aɪ': 0.0, 'ai': 0.0}, ('я', False): {'əɪ': math.log(0.5)},
    ('е', True): {'eɪ': 0.0, 'ei': 0.0, 'ɛɪ': 0.0}, ('е', False): {'eɪ': math.log(0.3)},
    ('у', True): {'uɪ': 0.0}, ('у', False): {'uɪ': 0.0},
    ('ю', True): {'uɪ': 0.0}, ('ю', False): {'uɪ': 0.0},
}
C_SETS = {
    'б': S('b', 'p', 'bʲ', 'β'), 'в': S('v', 'f', 'vʲ', 'w', 'β', 'ʋ', 'fʲ'), 'г': S('ɡ', 'k', 'ɣ', 'ɡʲ', 'kʲ', 'v', 'x'),
    'д': S('d', 'dʲ', 't', 'tʲ', 'ð'), 'ж': S('ʒ', 'ʐ', 'ʂ', 'ʃ', 'ʑ'), 'з': S('z', 's', 'sʲ', 'ʑ'), 'й': S('j', 'i'),
    'к': S('k', 'kʲ', 'ɡ', 'c', 'x'), 'л': S('l', 'ɫ', 'ɭʲ', 'ɭ', 'ʎ'), 'м': S('m', 'mʲ'), 'н': S('n', 'nʲ', 'ɲ', 'ŋ'),
    'п': S('p', 'pʲ', 'b'), 'р': S('r', 'ɾ', 'rʲ', 'ɹ', 'ʁ', 'r̝'), 'с': S('s', 'sʲ', 'z', 'ɕ', 'ʃ'), 'т': S('t', 'tʲ', 'd', 'dʲ', 'ts'),
    'ф': S('f', 'fʲ', 'v'), 'х': S('x', 'h', 'xʲ', 'ç', 'χ', 'k'), 'ц': S('ts', 's', 't'), 'ч': S('tɕ', 'tʃ', 'tʃʲ', 'ʃ', 'ɕ', 'tɕh'),
    'ш': S('ʃ', 'ʂ', 'ʒ', 'ɕ', 's'), 'щ': S('ɕ', 'ʃ', 'ʂ', 'tɕ'),
}

def word_tokens(word, stress, final=False):
    """Последовательность (набор, обязательна?) для слова; stress — индекс ударной гласной или None.
    final — слово перед паузой: последний слог там тянется у любого диктора, долгота не довод."""
    lw = word.lower().replace(ACC, '')
    nv = sum(ch in VOW for ch in lw)
    out, vi, prev = [], 0, None
    for i, ch in enumerate(lw):
        if ch in VOW:
            st = (vi == stress)
            key = (ch, st) if (ch, st) in V_SETS else (ch, True)
            # безударная «а» после мягкой/шипящей ведёт себя как «я»
            if ch == 'а' and not st and prev in ('ч', 'щ'): key = ('я', False)
            vs = V_SETS[key]
            if i + 1 < len(lw) and lw[i + 1] == 'й' and key in DIPH: vs = {**vs, **DIPH[key]}
            if final and vi == nv - 1:
                vs = {**vs, **{LONG[t]: w for t, w in vs.items() if t in LONG}}
            out.append((vs, True)); vi += 1
        elif ch in C_SETS:
            if ch == prev: continue  # двойные согласные — один звук
            out.append((C_SETS[ch], False))
        prev = ch
    return out

def ctc_score(lp, seq):
    """CTC-оценка последовательности наборов; согласные можно пропустить. lp: [T, V] log-probs."""
    T = lp.shape[0]
    N = len(seq)
    if N == 0: return 0.0
    vocab = VOC
    # эмиссии: [T, N] для токенов, [T] для бланка
    E = np.full((T, N), -1e9, dtype=np.float64)
    for j, (st, _) in enumerate(seq):
        ids = [vocab[t] for t in st if t in vocab]
        ws = np.array([st[t] for t in st if t in vocab])
        if not ids: continue
        E[:, j] = np.logaddexp.reduce(lp[:, ids] + ws[None, :], axis=1)
    B = lp[:, 0].astype(np.float64)
    opt = np.array([not req for _, req in seq])
    # состояния: 2j — бланк перед токеном j, 2j+1 — токен j, 2N — бланк в конце
    Sn = 2 * N + 1
    NEG = -1e18
    a = np.full(Sn, NEG)
    # стартовые состояния: бланк 0, токен 0, а также через пропускаемые токены
    starts = [0, 1]
    j = 0
    while j < N and opt[j]:
        starts += [2 * (j + 1), 2 * (j + 1) + 1] if j + 1 < N else [2 * (j + 1)]
        j += 1
    emit = lambda t: np.concatenate([np.stack([np.full(N, B[t]), E[t]], 1).reshape(-1), [B[t]]])
    e0 = emit(0)
    for s in starts:
        if s < Sn: a[s] = e0[s]
    # предшественники
    preds = [[] for _ in range(Sn)]
    for s in range(Sn):
        preds[s].append(s)
        if s > 0: preds[s].append(s - 1)
        if s % 2 == 1 and s >= 3: preds[s].append(s - 2)  # токен→токен
        # пропуск цепочки необязательных токенов перед этим состоянием
        j = (s - 1) // 2 if s % 2 == 1 else s // 2  # индекс токена, перед которым стоим (для бланка — следующий)
        k = j - 1
        while k >= 0 and opt[k]:
            preds[s] += [2 * k, 2 * k - 1] if k > 0 else [0]
            k -= 1
    L = max(len(p) for p in preds)
    P = np.full((Sn, L), Sn, dtype=np.int64)  # индекс Sn → NEG
    for s, p in enumerate(preds):
        p = sorted(set(x for x in p if 0 <= x < Sn)); P[s, :len(p)] = p
    for t in range(1, T):
        ap = np.append(a, NEG)
        a = np.logaddexp.reduce(ap[P], axis=1) + emit(t)
    ends = [Sn - 1, Sn - 2]
    k = N - 1
    while k >= 0 and opt[k]:
        ends += [2 * k, 2 * k - 1] if k > 0 else [0]
        k -= 1
    return float(np.logaddexp.reduce(a[[e for e in ends if 0 <= e < Sn]]))

def analyse(lid, text, path, d, verbose=False):
    lp = logprobs(path).numpy().astype(np.float64)
    info = []
    for m in re.finditer(r"[А-Яа-яЁё\u0301]+", text):
        w = m.group(0); si, nv = stress_index(w, d)
        rest = text[m.end():]
        final = not rest.strip() or (rest[0] != '-' and rest.lstrip()[0] in '.,!?:;—–…')
        info.append((w, si, nv, final))
    base = [word_tokens(w, si, f) for w, si, _, f in info]
    flat = lambda parts: [x for p in parts for x in p]
    res = []
    for wi, (w, si, nv, fin) in enumerate(info):
        if nv < 2: continue
        scores = []
        for k in range(nv):
            parts = list(base); parts[wi] = word_tokens(w, k, fin)
            scores.append(ctc_score(lp, flat(parts)))
        sc = np.array(scores)
        best = int(sc.argmax())
        margin = float(sc[best] - sc[si])
        spread = float(sc.max() - sc.min())
        res.append({'id': lid, 'word': w, 'dict': si, 'best': best, 'margin': round(margin, 2), 'spread': round(spread, 2), 'scores': [round(x, 1) for x in sc]})
    if verbose:
        print(lid, ' '.join(p for p, _ in greedy(logprobs(path))))
    return res

def accented(text, d):
    """Текст так, как его получила озвучка: ударения по словарю (как в tools/voice.mjs)."""
    def rep(m):
        w = m.group(0)
        if ACC in w or 'ё' in w.lower(): return w
        si, nv = stress_index(w, d)
        return mark(w, si) if nv >= 2 and si is not None else w
    return re.sub(r"[А-Яа-яЁё\u0301]+", rep, text)

def mark(word, k):
    lw = word.replace(ACC, '')
    vi = 0
    for i, ch in enumerate(lw):
        if ch.lower() in VOW:
            if vi == k: return lw[:i + 1] + ACC + lw[i + 1:]
            vi += 1
    return lw

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Проверка ударений в озвучке')
    ap.add_argument('ids', nargs='*', help='id реплик (по умолчанию все)')
    ap.add_argument('--src', default=os.path.join(ROOT, 'audio/src'))
    ap.add_argument('--thr', type=float, default=1.5, help='насколько другой вариант должен быть лучше')
    ap.add_argument('--json', default='')
    ap.add_argument('-v', action='store_true', help='показать распознанные звуки')
    a = ap.parse_args()
    lines = load_lines(); d = load_dict()
    allres, flagged = [], []
    for lid in a.ids or list(lines):
        f = os.path.join(a.src, lid + '.mp3')
        if not os.path.exists(f): continue
        r = analyse(lid, accented(lines[lid], d), f, d, a.v)
        allres += r
        for x in r:
            if x['best'] != x['dict'] and x['margin'] >= a.thr:
                flagged.append(x)
                print(f"!! {lid:18} {mark(x['word'], x['dict']):16} звучит как {mark(x['word'], x['best']):16} (+{x['margin']:.1f})", flush=True)
    dec = sum(1 for x in allres if x['spread'] >= a.thr)
    print(f'слов проверено: {len(allres)}, различимых по звуку: {dec}, подозрительных: {len(flagged)}')
    if a.json: json.dump(allres, open(a.json, 'w'), ensure_ascii=False, indent=0)
