/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID, addTodo, deleteTodo, getTodos } from './api/todos';
import { Todo } from './types/Todo';

type Status = 'all' | 'active' | 'completed';

function getVisibleTodos(todos: Todo[], status: Status): Todo[] {
  switch (status) {
    case 'active':
      return todos.filter(todo => !todo.completed);

    case 'completed':
      return todos.filter(todo => todo.completed);

    default:
      return todos;
  }
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<Status>('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [title, setTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const titleField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!USER_ID) {
      return;
    }

    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  // hide the notification after 3 seconds
  useEffect(() => {
    if (!errorMessage) {
      return undefined;
    }

    const timerId = setTimeout(() => setErrorMessage(''), 3000);

    return () => clearTimeout(timerId);
  }, [errorMessage]);

  // focus the field on load and after every request
  useEffect(() => {
    titleField.current?.focus();
  }, [tempTodo, todos.length]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setErrorMessage('');
    setTempTodo({
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    });

    addTodo(trimmedTitle)
      .then(newTodo => {
        setTodos(current => [...current, newTodo]);
        setTitle('');
      })
      .catch(() => setErrorMessage('Unable to add a todo'))
      .finally(() => setTempTodo(null));
  };

  const handleDelete = (todoId: number) => {
    setErrorMessage('');
    setLoadingIds(current => [...current, todoId]);

    return deleteTodo(todoId)
      .then(() => {
        setTodos(current => current.filter(todo => todo.id !== todoId));
      })
      .catch(() => setErrorMessage('Unable to delete a todo'))
      .finally(() => {
        setLoadingIds(current => current.filter(id => id !== todoId));
      });
  };

  const handleClearCompleted = () => {
    todos.filter(todo => todo.completed).forEach(todo => handleDelete(todo.id));
  };

  const renderTodo = (todo: Todo, isLoading: boolean) => (
    <div
      key={todo.id}
      data-cy="Todo"
      className={`todo ${todo.completed ? 'completed' : ''}`}
    >
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          readOnly
        />
      </label>

      <span data-cy="TodoTitle" className="todo__title">
        {todo.title}
      </span>

      <button
        type="button"
        className="todo__remove"
        data-cy="TodoDelete"
        onClick={() => handleDelete(todo.id)}
      >
        ×
      </button>

      <div
        data-cy="TodoLoader"
        className={`modal overlay ${isLoading ? 'is-active' : ''}`}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );

  const visibleTodos = getVisibleTodos(todos, status);
  const activeCount = todos.filter(todo => !todo.completed).length;
  const hasCompleted = todos.some(todo => todo.completed);
  const isAllCompleted = todos.length > 0 && activeCount === 0;

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {todos.length > 0 && (
            <button
              type="button"
              className={`todoapp__toggle-all ${
                isAllCompleted ? 'active' : ''
              }`}
              data-cy="ToggleAllButton"
            />
          )}

          <form onSubmit={handleSubmit}>
            <input
              ref={titleField}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={title}
              onChange={event => setTitle(event.target.value)}
              disabled={tempTodo !== null}
            />
          </form>
        </header>

        {(todos.length > 0 || tempTodo) && (
          <section className="todoapp__main" data-cy="TodoList">
            {visibleTodos.map(todo =>
              renderTodo(todo, loadingIds.includes(todo.id)),
            )}

            {tempTodo && renderTodo(tempTodo, true)}
          </section>
        )}

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${activeCount} items left`}
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${status === 'all' ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => setStatus('all')}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${
                  status === 'active' ? 'selected' : ''
                }`}
                data-cy="FilterLinkActive"
                onClick={() => setStatus('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${
                  status === 'completed' ? 'selected' : ''
                }`}
                data-cy="FilterLinkCompleted"
                onClick={() => setStatus('completed')}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={!hasCompleted}
              onClick={handleClearCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${
          errorMessage ? '' : 'hidden'
        }`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
