"""
Модуль для анализа температуры льда (hot/medium/cold) заявок.
"""
from typing import Optional, Dict, Tuple
from decimal import Decimal


def calculate_temperature_score(
    business_niche: Optional[str] = None,
    company_size: Optional[str] = None,
    task_volume: Optional[str] = None,
    role: Optional[str] = None,
    deadline: Optional[str] = None,
    budget: Optional[float] = None
) -> Tuple[int, str, str]:
    """
    Рассчитывает температуру льда на основе всех критериев.
    
    Returns:
        Tuple[int, str, str]: (score, temperature, department)
        - score: числовой балл от 0 до 100
        - temperature: "hot", "medium", "cold"
        - department: рекомендуемый отдел
    """
    score = 0
    max_score = 100
    
    # 1. Ниша бизнеса (0-20 баллов)
    high_value_niches = [
        "финтех", "fintech", "криптовалюты", "crypto", "blockchain",
        "медицина", "healthcare", "биотехнологии", "biotech",
        "энергетика", "energy", "нефть", "oil", "газ", "gas",
        "недвижимость", "real estate", "строительство", "construction",
        "логистика", "logistics", "транспорт", "transport",
        "образование", "education", "edtech"
    ]
    medium_value_niches = [
        "e-commerce", "интернет-магазин", "retail", "розница",
        "производство", "manufacturing", "промышленность", "industry",
        "реклама", "advertising", "маркетинг", "marketing",
        "консалтинг", "consulting", "услуги", "services"
    ]
    
    if business_niche:
        niche_lower = business_niche.lower()
        if any(niche in niche_lower for niche in high_value_niches):
            score += 20
        elif any(niche in niche_lower for niche in medium_value_niches):
            score += 10
        else:
            score += 5
    
    # 2. Размер компании (0-20 баллов)
    company_size_scores = {
        "enterprise": 20,
        "large": 15,
        "medium": 10,
        "small": 5,
        "startup": 3
    }
    if company_size:
        score += company_size_scores.get(company_size.lower(), 0)
    
    # 3. Объем задачи (0-15 баллов)
    task_volume_scores = {
        "enterprise": 15,
        "large": 12,
        "medium": 8,
        "small": 4
    }
    if task_volume:
        score += task_volume_scores.get(task_volume.lower(), 0)
    
    # 4. Роль заполняющего (0-20 баллов)
    high_priority_roles = ["ceo", "генеральный директор", "директор", "founder", "основатель", "owner", "владелец"]
    medium_priority_roles = ["cto", "технический директор", "cfo", "финансовый директор", "coo", "операционный директор"]
    manager_roles = ["менеджер", "manager", "руководитель", "head", "lead"]
    
    if role:
        role_lower = role.lower()
        if any(r in role_lower for r in high_priority_roles):
            score += 20
        elif any(r in role_lower for r in medium_priority_roles):
            score += 15
        elif any(r in role_lower for r in manager_roles):
            score += 10
        else:
            score += 5
    
    # 5. Сроки (0-15 баллов)
    deadline_scores = {
        "urgent": 15,
        "срочно": 15,
        "asap": 15,
        "1-2 weeks": 10,
        "1-2 недели": 10,
        "1 month": 5,
        "1 месяц": 5,
        "flexible": 2,
        "гибкие": 2
    }
    if deadline:
        deadline_lower = deadline.lower()
        for key, value in deadline_scores.items():
            if key in deadline_lower:
                score += value
                break
    
    # 6. Бюджет (0-10 баллов)
    if budget:
        budget_decimal = Decimal(str(budget))
        if budget_decimal >= Decimal("1000000"):  # 1M+
            score += 10
        elif budget_decimal >= Decimal("500000"):  # 500K+
            score += 8
        elif budget_decimal >= Decimal("200000"):  # 200K+
            score += 6
        elif budget_decimal >= Decimal("100000"):  # 100K+
            score += 4
        elif budget_decimal >= Decimal("50000"):  # 50K+
            score += 2
        else:
            score += 1
    
    # Определяем температуру
    if score >= 70:
        temperature = "hot"
    elif score >= 40:
        temperature = "medium"
    else:
        temperature = "cold"
    
    # Определяем отдел
    department = determine_department(business_niche, company_size, task_volume, role, budget)
    
    return score, temperature, department


def determine_department(
    business_niche: Optional[str] = None,
    company_size: Optional[str] = None,
    task_volume: Optional[str] = None,
    role: Optional[str] = None,
    budget: Optional[float] = None
) -> str:
    """
    Определяет рекомендуемый отдел для работы с заявкой.
    """
    # Если большой бюджет или enterprise - VIP отдел
    if budget and budget >= 500000:
        return "VIP отдел"
    
    if company_size and company_size.lower() == "enterprise":
        return "VIP отдел"
    
    # Технические ниши - технический отдел
    tech_niches = ["финтех", "fintech", "криптовалюты", "crypto", "blockchain", "edtech", "saas"]
    if business_niche and any(niche in business_niche.lower() for niche in tech_niches):
        return "Технический отдел"
    
    # Медицина и биотех - специализированный отдел
    if business_niche and any(niche in business_niche.lower() for niche in ["медицина", "healthcare", "биотехнологии", "biotech"]):
        return "Специализированный отдел"
    
    # Большие задачи - отдел крупных проектов
    if task_volume and task_volume.lower() in ["large", "enterprise"]:
        return "Отдел крупных проектов"
    
    # По умолчанию - общий отдел
    return "Общий отдел"


def get_temperature_info(temperature: str) -> Dict[str, str]:
    """
    Возвращает информацию о температуре для отображения.
    """
    info = {
        "hot": {
            "label": "Горячий",
            "description": "Высокоприоритетная заявка. Требует немедленного внимания.",
            "color": "red",
            "icon": "🔥",
            "needs_manager": "Да, персональный менеджер обязателен"
        },
        "medium": {
            "label": "Теплый",
            "description": "Средний приоритет. Стандартная обработка.",
            "color": "orange",
            "icon": "🌡️",
            "needs_manager": "Рекомендуется персональный менеджер"
        },
        "cold": {
            "label": "Холодный",
            "description": "Низкий приоритет. Можно обработать в общем порядке.",
            "color": "blue",
            "icon": "❄️",
            "needs_manager": "Не требуется персональный менеджер"
        }
    }
    return info.get(temperature, info["cold"])

