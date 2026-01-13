package com.java.web_travel.repository;

import com.java.web_travel.entity.Order;
import com.java.web_travel.entity.User;
import com.java.web_travel.model.response.PageResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Repository
public class SearchRepository {

    @PersistenceContext
    private EntityManager entityManager;

    private static final Pattern SORT_TOKEN =
            Pattern.compile("^([A-Za-z][A-Za-z0-9_]*)\\s*(?::\\s*(asc|desc))?\\s*$", Pattern.CASE_INSENSITIVE);

    private static final Set<String> ORDER_SORT_FIELDS = Set.of(
            "id",
            "destination",
            "numberOfPeople",
            "orderDate",
            "checkinDate",
            "checkoutDate",
            "startHotel",
            "endHotel",
            "totalPrice"
    );

    private static final Set<String> USER_SORT_FIELDS = Set.of(
            "id",
            "phone",
            "fullName",
            "email",
            "birthday",
            "status"
    );

    public PageResponse getAllOrderWithSortByMultipleColumsAndSearch(int pageNo,
                                                                     int pageSize,
                                                                     String search,
                                                                     String sortBy) {
        int safePageNo = Math.max(pageNo, 0);
        int safePageSize = pageSize > 0 ? pageSize : 10;

        String keyword = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : null;

        StringBuilder jpql = new StringBuilder("select o from Order o where 1=1");
        if (keyword != null) {
            jpql.append(" and lower(o.destination) like :destination");
        }

        String orderByClause = buildOrderByClause("o", sortBy, ORDER_SORT_FIELDS);
        if (orderByClause != null) {
            jpql.append(" ").append(orderByClause);
        }

        TypedQuery<Order> selectQuery = entityManager.createQuery(jpql.toString(), Order.class);
        if (keyword != null) {
            selectQuery.setParameter("destination", "%" + keyword + "%");
        }
        selectQuery.setFirstResult(safePageNo * safePageSize);
        selectQuery.setMaxResults(safePageSize);

        List<Order> orders = selectQuery.getResultList();

        StringBuilder countJpql = new StringBuilder("select count(o) from Order o where 1=1");
        if (keyword != null) {
            countJpql.append(" and lower(o.destination) like :destination");
        }

        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);
        if (keyword != null) {
            countQuery.setParameter("destination", "%" + keyword + "%");
        }

        Long totalElements = countQuery.getSingleResult();
        int totalPages = (totalElements == 0) ? 0 : (int) ((totalElements + safePageSize - 1) / safePageSize);

        return PageResponse.builder()
                .pageNo(safePageNo)
                .pageSize(safePageSize)
                .totalPages(totalPages)
                .items(orders)
                .build();
    }

    public PageResponse advanceSearchOrder(int pageNo, int pageSize, String sortBy, String... search) {
        String keyword = null;
        if (search != null && search.length > 0 && StringUtils.hasText(search[0])) {
            keyword = search[0].trim();
        }
        return getAllOrderWithSortByMultipleColumsAndSearch(pageNo, pageSize, keyword, sortBy);
    }

    public PageResponse findBySearch(int pageNo, int pageSize, String search) {
        int safePageNo = Math.max(pageNo, 0);
        int safePageSize = pageSize > 0 ? pageSize : 10;

        String keyword = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : null;

        StringBuilder jpql = new StringBuilder("select u from User u where 1=1");
        if (keyword != null) {
            jpql.append(" and (lower(u.fullName) like :kw")
                    .append(" or u.phone like :kwPhone")
                    .append(" or lower(u.email) like :kw)");
        }

        TypedQuery<User> selectQuery = entityManager.createQuery(jpql.toString(), User.class);
        if (keyword != null) {
            selectQuery.setParameter("kw", "%" + keyword + "%");
            selectQuery.setParameter("kwPhone", "%" + search.trim() + "%");
        }
        selectQuery.setFirstResult(safePageNo * safePageSize);
        selectQuery.setMaxResults(safePageSize);

        List<User> users = selectQuery.getResultList();

        StringBuilder countJpql = new StringBuilder("select count(u) from User u where 1=1");
        if (keyword != null) {
            countJpql.append(" and (lower(u.fullName) like :kw")
                    .append(" or u.phone like :kwPhone")
                    .append(" or lower(u.email) like :kw)");
        }

        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);
        if (keyword != null) {
            countQuery.setParameter("kw", "%" + keyword + "%");
            countQuery.setParameter("kwPhone", "%" + search.trim() + "%");
        }

        Long totalElements = countQuery.getSingleResult();
        int totalPages = (totalElements == 0) ? 0 : (int) ((totalElements + safePageSize - 1) / safePageSize);

        return PageResponse.builder()
                .pageNo(safePageNo)
                .pageSize(safePageSize)
                .totalPages(totalPages)
                .items(users)
                .build();
    }

    private String buildOrderByClause(String alias, String sortBy, Set<String> allowedFields) {
        if (!StringUtils.hasText(sortBy)) {
            return null;
        }

        String[] tokens = sortBy.split(",");
        List<String> orderParts = new ArrayList<>();

        for (String rawToken : tokens) {
            if (!StringUtils.hasText(rawToken)) continue;

            String token = rawToken.trim();
            Matcher matcher = SORT_TOKEN.matcher(token);
            if (!matcher.matches()) {
                continue;
            }

            String field = matcher.group(1);
            if (!allowedFields.contains(field)) {
                continue;
            }

            String direction = (matcher.group(2) != null) ? matcher.group(2).toLowerCase(Locale.ROOT) : "asc";
            if (!direction.equals("asc") && !direction.equals("desc")) {
                direction = "asc";
            }

            orderParts.add(alias + "." + field + " " + direction);
        }

        if (orderParts.isEmpty()) {
            return null;
        }

        return "order by " + String.join(", ", orderParts);
    }
}
